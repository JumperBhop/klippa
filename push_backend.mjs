import { readFileSync } from "fs";
import { Client } from "ssh2";

const HOST = "178.105.137.126";
const USER = "root";
const PASS = "Jumper7147!";

// Flat files → /app/<name>
const FILES = [
  { local: "backend/database.py",       remote: "/tmp/database.py" },
  { local: "backend/main.py",           remote: "/tmp/main.py" },
  { local: "backend/pipeline.py",       remote: "/tmp/pipeline.py" },
  { local: "backend/import_service.py", remote: "/tmp/import_service.py" },
];

// Provider module → /app/providers/<name>
const PROVIDER_FILES = [
  { local: "backend/providers/__init__.py",        remote: "/tmp/providers/__init__.py" },
  { local: "backend/providers/base.py",            remote: "/tmp/providers/base.py" },
  { local: "backend/providers/youtube_rapidapi.py",remote: "/tmp/providers/youtube_rapidapi.py" },
  { local: "backend/providers/ytdlp.py",           remote: "/tmp/providers/ytdlp.py" },
];

function execCmd(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "", errout = "";
      stream.on("data", d => out += d);
      stream.stderr.on("data", d => errout += d);
      stream.on("close", (code) => {
        if (code !== 0) {
          console.log(`  stdout: ${out.trim()}`);
          console.log(`  stderr: ${errout.trim()}`);
          reject(new Error(`Command failed (exit ${code}): ${cmd}`));
        } else {
          resolve(out.trim());
        }
      });
    });
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const content = readFileSync(localPath);
    const ws = sftp.createWriteStream(remotePath);
    ws.on("close", resolve);
    ws.on("error", reject);
    ws.end(content);
  });
}

const conn = new Client();
conn.on("ready", async () => {
  console.log("✓ SSH connected");
  try {
    // Find container name
    const containers = await execCmd(conn, "docker ps --format '{{.Names}}'");
    const container = containers.split("\n").find(n => n.toLowerCase().includes("klippa")) || "klippa";
    console.log(`✓ Container: ${container}`);

    // Upload files via SFTP
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) return reject(err);
        // Create /tmp/providers/ directory first, then upload all files
        sftp.mkdir("/tmp/providers", () => {
          // ignore error if already exists
          Promise.all([
            ...FILES.map(f => {
              console.log(`  Uploading ${f.local} → ${f.remote}`);
              return uploadFile(sftp, f.local, f.remote);
            }),
            ...PROVIDER_FILES.map(f => {
              console.log(`  Uploading ${f.local} → ${f.remote}`);
              return uploadFile(sftp, f.local, f.remote);
            }),
          ]).then(resolve).catch(reject);
        });
      });
    });
    console.log("✓ Files uploaded to /tmp");

    // Ensure /app/providers/ exists in container
    await execCmd(conn, `docker exec ${container} mkdir -p /app/providers`);

    // Copy flat files into container
    for (const f of FILES) {
      const dest = "/app/" + f.remote.split("/").pop();
      await execCmd(conn, `docker cp ${f.remote} ${container}:${dest}`);
      console.log(`  docker cp → ${dest}`);
    }

    // Copy provider module files into container
    for (const f of PROVIDER_FILES) {
      const dest = "/app/providers/" + f.remote.split("/").pop();
      await execCmd(conn, `docker cp ${f.remote} ${container}:${dest}`);
      console.log(`  docker cp → ${dest}`);
    }
    console.log("✓ Files copied into container");

    // Restart container
    await execCmd(conn, `docker restart ${container}`);
    console.log("✓ Container restarted");

    // Wait and health check
    await new Promise(r => setTimeout(r, 3000));
    const health = await execCmd(conn, "curl -s http://localhost:8000/health");
    console.log(`✓ Health: ${health}`);

  } catch (e) {
    console.error("✗ Error:", e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
});

conn.connect({ host: HOST, port: 22, username: USER, password: PASS });
