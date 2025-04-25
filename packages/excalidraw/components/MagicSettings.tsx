import { useState } from "react";
import { Dialog } from "./Dialog";
import { TextField } from "./TextField";
import { MagicIcon, OpenAIIcon } from "./icons";
import { FilledButton } from "./FilledButton";
import { CheckboxItem } from "./CheckboxItem";
import { KEYS } from "../keys";
import { useUIAppState } from "../context/ui-appState";
import { InlineIcon } from "./InlineIcon";
import { Paragraph } from "./Paragraph";

import "./MagicSettings.scss";
import TTDDialogTabs from "./TTDDialog/TTDDialogTabs";
import { TTDDialogTab } from "./TTDDialog/TTDDialogTab";
import { useI18n } from "../i18n";
import { getBaseUrl, getLLMModel, getVLMModel, getTextToDiagramPrompt, getDiagramToCodePrompt } from "../data/magic";
import { EditorLocalStorage } from "../data/EditorLocalStorage";
import { EDITOR_LS_KEYS } from "../constants";

export const MagicSettings = (props: {
  openAIKey: string | null;
  isPersisted: boolean;
  onChange: (key: string, shouldPersist: boolean) => void;
  onConfirm: (key: string, shouldPersist: boolean) => void;
  onClose: () => void;
}) => {
  const [keyInputValue, setKeyInputValue] = useState(props.openAIKey || "");
  const [shouldPersist, setShouldPersist] = useState<boolean>(
    props.isPersisted,
  );

  const appState = useUIAppState();
  const { t } = useI18n();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const [baseUrl, setBaseUrl] = useState(getBaseUrl());
  const [vlmModel, setVlmModel] = useState(getVLMModel());
  const [llmModel, setLlmModel] = useState(getLLMModel());

  const [textToDiagramPrompt, setTextToDiagramPrompt] = useState(getTextToDiagramPrompt());
  const [diagramToCodePrompt, setDiagramToCodePrompt] = useState(getDiagramToCodePrompt());

  const onConfirm = () => {
    EditorLocalStorage.set(EDITOR_LS_KEYS.MAGIC_BASE_URL, baseUrl);
    EditorLocalStorage.set(EDITOR_LS_KEYS.MAGIC_VLM_MODEL, vlmModel);
    EditorLocalStorage.set(EDITOR_LS_KEYS.MAGIC_LLM_MODEL, llmModel);
    EditorLocalStorage.set(EDITOR_LS_KEYS.MAGIC_TEXT_TO_DIAGRAM_PROMPT, textToDiagramPrompt);
    EditorLocalStorage.set(EDITOR_LS_KEYS.MAGIC_DIAGRAM_TO_CODE_PROMPT, diagramToCodePrompt);
    props.onConfirm(keyInputValue.trim(), shouldPersist);
  };

  if (appState.openDialog?.name !== "settings") {
    return null;
  }

  return (
    <Dialog
      onCloseRequest={() => {
        props.onClose();
        props.onConfirm(keyInputValue.trim(), shouldPersist);
      }}
      title={
        <div style={{ display: "flex" }}>
          {t("magicSettings.title")}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.1rem 0.5rem",
              marginLeft: "1rem",
              fontSize: 14,
              borderRadius: "12px",
              background: "var(--color-promo)",
              color: "var(--color-surface-lowest)",
            }}
          >
            {t("magicSettings.experimentalFeature")}
          </div>
        </div>
      }
      className="MagicSettings"
      autofocus={false}
    >
      <TTDDialogTabs dialog="settings" tab={appState.openDialog.tab}>
        <TTDDialogTab
          tab="diagram-to-code"
        >
          <Paragraph>
            <a href="https://github.com/excalidraw/excalidraw" target="_blank" rel="noopener noreferrer">
              {t("magicSettings.originalProject")}
            </a>{" "}
            {t("magicSettings.useOpenAI")}
          </Paragraph>
          <Paragraph>
            {t("magicSettings.requestKey")}{" "}
            <a
              href="mailto:ZZG-FITS-AI-Services@f-i-ts.de"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("magicSettings.FITSAIMail")}
            </a>
              {t("magicSettings.useKey")}
          </Paragraph>
          <TextField
            isRedacted
            value={keyInputValue}
            placeholder={t("magicSettings.apiKeyPlaceholder")}
            label={t("magicSettings.apiKeyLabel")}
            onChange={(value) => {
              setKeyInputValue(value);
              props.onChange(value.trim(), shouldPersist);
            }}
            selectOnRender
            onKeyDown={(event) => event.key === KEYS.ENTER && onConfirm()}
          />
          
          <Paragraph>
            {t("magicSettings.tokenNotSaved")}
            {" "}
            {t("magicSettings.saveInBrowser")}
          </Paragraph>

          <CheckboxItem checked={shouldPersist} onChange={setShouldPersist}>
            {t("magicSettings.persistKey")}
          </CheckboxItem>

          <Paragraph>
            {t("magicSettings.dialogAccess")} <b>{t("magicSettings.aiSettings")}</b>{" "}
            <InlineIcon icon={OpenAIIcon} /> {t("magicSettings.dialogAccessSuffix")}
          </Paragraph>

          <details 
            open={isAdvancedOpen}
            onToggle={(e) => setIsAdvancedOpen(e.currentTarget.open)}
          >
            <summary>{t("magicSettings.advancedOptions")}</summary>
            <div className="magic-settings-advanced">
              <TextField
                label={t("magicSettings.baseUrl")}
                value={baseUrl}
                onChange={(value) => setBaseUrl(value)}
                placeholder="https://api.ai-demo.officelan.izb/v1"
              />
              <TextField
                label={t("magicSettings.vlmModel")}
                value={vlmModel}
                onChange={(value) => setVlmModel(value)}
                placeholder="FITS/Kiero-Vision"
              />
              <TextField
                label={t("magicSettings.llmModel")} 
                value={llmModel}
                onChange={(value) => setLlmModel(value)}
                placeholder="FITS/Kiero"
              />
              
              <TextField
                label={t("magicSettings.textToDiagramPrompt")}
                value={textToDiagramPrompt}
                onChange={(value) => setTextToDiagramPrompt(value)}
                placeholder={t("magicSettings.textToDiagramPromptPlaceholder")}
                type="textarea"
              />
              
              <TextField
                label={t("magicSettings.diagramToCodePrompt")}
                value={diagramToCodePrompt}
                onChange={(value) => setDiagramToCodePrompt(value)}
                placeholder={t("magicSettings.diagramToCodePromptPlaceholder")}
                type="textarea"
              />
            </div>
          </details>

          <FilledButton
            className="MagicSettings__confirm"
            size="large"
            label={t("magicSettings.confirm")}
            onClick={onConfirm}
          />
        </TTDDialogTab>
      </TTDDialogTabs>
    </Dialog>
  );
};
