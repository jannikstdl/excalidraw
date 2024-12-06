import { EDITOR_LS_KEYS, THEME } from "../constants";
import { EditorLocalStorage } from "./EditorLocalStorage";
import type { Theme } from "../element/types";
import type { DataURL } from "../types";
import type { OpenAIInput, OpenAIOutput } from "./ai/types";

export type MagicCacheData =
  | {
      status: "pending";
    }
  | { status: "done"; html: string }
  | {
      status: "error";
      message?: string;
      code: "ERR_GENERATION_INTERRUPTED" | string;
    };

const SYSTEM_PROMPT = `You are a skilled front-end developer who builds interactive prototypes from wireframes, and is an expert at CSS Grid and Flex design.
Your role is to transform low-fidelity wireframes into working front-end HTML code.

YOU MUST FOLLOW FOLLOWING RULES:

- Use HTML, CSS, JavaScript to build a responsive, accessible, polished prototype
- Leverage Tailwind for styling and layout (import as script <script src="https://cdn.tailwindcss.com"></script>)
- Inline JavaScript when needed
- Fetch dependencies from CDNs when needed (using unpkg or skypack)
- Source images from Unsplash or create applicable placeholders
- Interpret annotations as intended vs literal UI
- Fill gaps using your expertise in UX and business logic
- generate primarily for desktop UI, but make it responsive.
- Use grid and flexbox wherever applicable.
- Convert the wireframe in its entirety, don't omit elements if possible.

If the wireframes, diagrams, or text is unclear or unreadable, refer to provided text for clarification.

Your goal is a production-ready prototype that brings the wireframes to life.

Please output JUST THE HTML file containing your best attempt at implementing the provided wireframes.`;

// 获取默认值
export const getBaseUrl = (): string => {
  return EditorLocalStorage.get(EDITOR_LS_KEYS.MAGIC_BASE_URL) || "https://api.siliconflow.cn/v1";
};

export const getVLMModel = (): string => {
  return EditorLocalStorage.get(EDITOR_LS_KEYS.MAGIC_VLM_MODEL) || "Qwen/Qwen2-VL-72B-Instruct";
};

export const getLLMModel = (): string => {
  return EditorLocalStorage.get(EDITOR_LS_KEYS.MAGIC_LLM_MODEL) || "Qwen/Qwen2.5-Coder-32B-Instruct";
};

export async function diagramToHTML({
  image,
  apiKey,
  text,
  theme = THEME.LIGHT,
  baseUrl = getBaseUrl(),
  vlmModel = getVLMModel(),
}: {
  image: DataURL;
  apiKey: string;
  text: string;
  theme?: Theme;
  baseUrl?: string;
  vlmModel?: string;
}) {
  const body: OpenAIInput.ChatCompletionCreateParamsBase = {
    model: vlmModel,
    // 4096 are max output tokens allowed for `gpt-4-vision-preview` currently
    max_tokens: 4096,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: image,
              detail: "high",
            },
          },
          {
            type: "text",
            text: `Above is the reference wireframe. Please make a new website based on these and return just the HTML file. Also, please make it for the ${theme} theme. What follows are the wireframe's text annotations (if any)...`,
          },
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };

  let result:
    | ({ ok: true } & OpenAIOutput.ChatCompletion)
    | ({ ok: false } & OpenAIOutput.APIError);

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (resp.ok) {
    const json: OpenAIOutput.ChatCompletion = await resp.json();
    result = { ...json, ok: true };
  } else {
    const json: OpenAIOutput.APIError = await resp.json();
    result = { ...json, ok: false };
  }

  return result;
}
