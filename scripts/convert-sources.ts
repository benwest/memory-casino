import { execSync } from "child_process";
import * as fs from "fs/promises";
import { basename, extname, join } from "path";
import { type SourceData } from "../src/state/sources";

const sourceDir = join(__dirname, "..", "sources");
const destDir = join(__dirname, "..", "public", "videos");

// Loop over all files in ./sources directory
const sourceFiles = (await fs.readdir(sourceDir)).filter(file =>
  [".mp4", ".mov", ".avi", ".mkv"].includes(extname(file).toLowerCase())
);
const manifest: SourceData[] = [];

async function fileExists(path: string) {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

for (const file of sourceFiles) {
  const filename = basename(file);
  const name = basename(file, extname(file));
  const inputPath = join(sourceDir, file);
  const videoPath = join(destDir, `${name}.webm`);
  const imagePath = join(destDir, `${name}.webp`);

  console.log(`Converting ${filename}...`);

  try {
    if (!(await fileExists(videoPath))) {
      execSync(
        `ffmpeg -y -i "${inputPath}" \
        -c:v libvpx-vp9 -crf 30 -b:v 0 -an \
        -vf "scale=128:384:force_original_aspect_ratio=increase,crop=128:384" \
        "${videoPath}"`,
        { stdio: "inherit" }
      );
    } else {
      console.log(`  Video already exists, skipping conversion.`);
    }

    if (!(await fileExists(imagePath))) {
      execSync(
        `ffmpeg -y -i "${videoPath}" -vframes 1 -q:v 80 "${imagePath}"`,
        { stdio: "inherit" }
      );
    } else {
      console.log(`  Thumbnail already exists, skipping generation.`);
    }

    const duration = parseFloat(
      execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
      ).toString()
    );

    manifest.push({
      url: "/videos/" + basename(videoPath),
      image: "/videos/" + basename(imagePath),
      duration,
    });
  } catch (error) {
    console.error(`Error converting ${filename}:`, error);
    process.exit(1);
  }
}

// Delete files in destDir that are not in destFiles
const existingDestFiles = await fs.readdir(destDir);
for (const file of existingDestFiles) {
  const name = basename(file, extname(file));
  if (!sourceFiles.some(src => basename(src, extname(src)) === name)) {
    console.log(`Deleting obsolete file ${file}...`);
    await fs.unlink(join(destDir, file));
  }
}

await fs.writeFile(
  join(__dirname, "..", "src", "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
