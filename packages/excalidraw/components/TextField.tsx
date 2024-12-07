import type { KeyboardEvent } from "react";
import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from "react";
import clsx from "clsx";

import "./TextField.scss";
import { Button } from "./Button";
import { eyeIcon, eyeClosedIcon } from "./icons";

type TextFieldProps = {
  onChange?: (value: string) => void;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  readonly?: boolean;
  fullWidth?: boolean;
  selectOnRender?: boolean;
  type?: "text" | "password" | "textarea";

  label?: string;
  placeholder?: string;
  isRedacted?: boolean;
} & ({ value: string } | { defaultValue: string });

export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  (
    {
      onChange,
      label,
      fullWidth,
      placeholder,
      readonly,
      selectOnRender,
      onKeyDown,
      isRedacted = false,
      type = "text",
      ...rest
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    useLayoutEffect(() => {
      if (selectOnRender) {
        innerRef.current?.select();
      }
    }, [selectOnRender]);

    const [isTemporarilyUnredacted, setIsTemporarilyUnredacted] =
      useState<boolean>(false);

    const commonProps = {
      className: clsx({
        "is-redacted":
          "value" in rest &&
          rest.value &&
          isRedacted &&
          !isTemporarilyUnredacted,
      }),
      readOnly: readonly,
      value: "value" in rest ? rest.value : undefined,
      defaultValue: "defaultValue" in rest ? rest.defaultValue : undefined,
      placeholder: placeholder,
      ref: innerRef as any,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        onChange?.(event.target.value),
      onKeyDown,
      spellCheck: false,
    };

    if (type === "textarea") {
      return (
        <div
          className={clsx("ExcTextField", {
            "ExcTextField--fullWidth": fullWidth,
          })}
        >
          <div className="ExcTextField__label">{label}</div>
          <div
            className={clsx("ExcTextField__input", "ExcTextField__input--textarea", {
              "ExcTextField__input--readonly": readonly,
            })}
          >
            <textarea {...commonProps} />
          </div>
        </div>
      );
    }

    return (
      <div
        className={clsx("ExcTextField", {
          "ExcTextField--fullWidth": fullWidth,
        })}
        onClick={() => {
          innerRef.current?.focus();
        }}
      >
        <div className="ExcTextField__label">{label}</div>
        <div
          className={clsx("ExcTextField__input", {
            "ExcTextField__input--readonly": readonly,
          })}
        >
          <input {...commonProps} />
          {isRedacted && (
            <Button
              onSelect={() =>
                setIsTemporarilyUnredacted(!isTemporarilyUnredacted)
              }
              style={{ border: 0, userSelect: "none" }}
            >
              {isTemporarilyUnredacted ? eyeClosedIcon : eyeIcon}
            </Button>
          )}
        </div>
      </div>
    );
  },
);
