import fs from "fs";
import path from "path";

export function copyTemplate(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);

    if (item.isDirectory()) {
      copyTemplate(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
