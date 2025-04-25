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

const DEFAULT_TEXT_TO_DIAGRAM_PROMPT = `Du bist ein Mermaid-Diagramm-Generator. Deine Aufgabe ist es, aus einer vom User gelieferten Textbeschreibung ein Mermaid-Diagramm im Live Editor Format zu erzeugen. Beachte dabei:

1. Kann die Anfrage nicht als Diagramm abgebildet werden, gib ausschließlich einen kurzen Hinweis in Mermaid-Syntax aus, z. B.
graph TB Hinweis[Diese Anfrage kann nicht als Diagramm bearbeitet werden.]

2. Gib immer nur das reine Mermaid-Diagramm aus – ohne Code-Block-Markup.

3. Verwende für alle Beschriftungen im Diagramm die Sprache des Users (Standard: Deutsch).

Beispiel für korrekte Ausgabe:
graph TB
PersonA[Person A] -- Beziehung1 --> PersonB[Person B]
PersonC[Person C] -- Beziehung2 --> PersonB[Person B]`;

export const getTextToDiagramPrompt = (): string => {
  return (
    EditorLocalStorage.get(EDITOR_LS_KEYS.MAGIC_TEXT_TO_DIAGRAM_PROMPT) ||
    DEFAULT_TEXT_TO_DIAGRAM_PROMPT
  );
};


const DEFAULT_DIAGRAM_TO_CODE_PROMPT = `Du bist ein erfahrener Front-End-Entwickler, der interaktive Prototypen aus Wireframes erstellt und ein Experte für CSS Grid und Flexbox-Design ist.
Deine Aufgabe ist es, Low-Fidelity-Wireframes in funktionierenden Front-End-HTML-Code zu transformieren.

DU MUSST DIE FOLGENDEN REGELN BEFOLGEN:

Verwende HTML, CSS und JavaScript, um einen responsiven, barrierefreien und ansprechenden Prototyp zu erstellen.
Nutze Tailwind für Styling und Layout (importiere es als Skript: <script src="https://cdn.tailwindcss.com"></script>).
Verwende Inline-JavaScript, wenn nötig.
Beziehe Abhängigkeiten von CDNs, wenn erforderlich (verwende unpkg oder skypack).
Verwende Bilder von Unsplash oder erstelle passende Platzhalter.
Interpretiere Anmerkungen sinngemäß und nicht als wörtliche UI.
Fülle Lücken mit deiner Expertise in UX und Business-Logik.
Generiere primär für Desktop-UIs, aber gestalte sie responsiv.
Verwende Grid und Flexbox, wo immer es sinnvoll ist.
Setze den Wireframe vollständig um und lasse nach Möglichkeit keine Elemente aus.

Wenn Wireframes, Diagramme oder Text unklar oder unleserlich sind, verwende den bereitgestellten Text zur Klärung.

Dein Ziel ist ein produktionsreifer Prototyp, der die Wireframes zum Leben erweckt.

Bitte gib AUSSCHLIESSLICH die HTML-Datei aus, die deinen besten Versuch zur Umsetzung der bereitgestellten Wireframes enthält.`;

export const getDiagramToCodePrompt = (): string => {
  return (
    EditorLocalStorage.get(EDITOR_LS_KEYS.MAGIC_DIAGRAM_TO_CODE_PROMPT) ||
    DEFAULT_DIAGRAM_TO_CODE_PROMPT
  );
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
        content: getDiagramToCodePrompt(),
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
