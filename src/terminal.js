import { checkbox, input as inputPrompt, select } from "@inquirer/prompts";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

function hasInteractiveTerminal() {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

async function readLine(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

export function createTerminal() {
  return {
    async ask(question, defaultValue = "") {
      if (hasInteractiveTerminal()) {
        const answer = await inputPrompt({ message: question, default: defaultValue || undefined });
        return answer.trim() || defaultValue;
      }

      const suffix = defaultValue ? ` (${defaultValue})` : "";
      const answer = (await readLine(`${question}${suffix}: `)).trim();
      return answer || defaultValue;
    },

    async choose(question, options, defaultKey) {
      if (hasInteractiveTerminal()) {
        return select({
          message: question,
          choices: options.map(({ key, label, description }) => ({ value: key, name: label, description })),
          default: defaultKey
        });
      }

      const choices = options.map(({ key, label }) => `${key}=${label}`).join(" / ");
      while (true) {
        const answer = (await readLine(`${question} [${choices}] (${defaultKey}): `)).trim().toLowerCase() || defaultKey;
        const match = options.find(({ key }) => key === answer);
        if (match) return match.key;
        console.log("กรุณาเลือกค่าที่แสดงไว้");
      }
    },

    async multiSelect(question, choices, { min = 1, max = 3 } = {}) {
      if (hasInteractiveTerminal()) {
        return checkbox({
          message: question,
          choices: choices.map(({ key, label, description, checked = false }) => ({
            value: key,
            name: label,
            checkedName: label,
            description,
            checked
          })),
          required: min > 0,
          pageSize: 12,
          validate(selected) {
            if (selected.length < min) return `กรุณาเลือกอย่างน้อย ${min} รายการ`;
            if (selected.length > max) return `เลือกได้สูงสุด ${max} รายการ`;
            return true;
          }
        });
      }

      console.log(`\n${question}`);
      choices.forEach((choice, index) => console.log(`${index + 1}. ${choice.label}`));
      while (true) {
        const answer = (await readLine(`เลือก ${min}-${max} รายการด้วยหมายเลข เช่น 1,3: `)).trim();
        const indexes = [...new Set(answer.split(",").map((item) => Number(item.trim()) - 1))];
        const selected = indexes.filter((index) => Number.isInteger(index) && choices[index]).map((index) => choices[index].key);
        if (selected.length >= min && selected.length <= max) return selected;
        console.log(`กรุณาเลือกตั้งแต่ ${min} ถึง ${max} รายการ`);
      }
    },

    async multiline(question) {
      console.log(`${question}\nพิมพ์ .done ในบรรทัดใหม่เมื่อจบ`);
      const rl = createInterface({ input: stdin, output: stdout });
      const lines = [];
      try {
        while (true) {
          const line = await rl.question(lines.length === 0 ? "> " : "  ");
          if (line.trim() === ".done") break;
          lines.push(line);
        }
      } finally {
        rl.close();
      }
      return lines.join("\n").trim();
    },

    close() {}
  };
}
