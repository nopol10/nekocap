---
name: nekocap-forms-i18n
description: Use when building or modifying a form, binding inputs, adding validation, or adding/changing any user-facing string in the nekocap frontend. Triggers on tasks like "add a form", "add a text field", "show a label", or "add a translation key".
---

This skill covers two tightly coupled concerns: form handling (react-hook-form + antd via `Controller`) and i18n (next-i18next, English-string-as-key).

## Forms — react-hook-form + antd

**Never bind a raw `<input>` to a form.** Every input is an antd component wrapped in react-hook-form's `Controller`:

```ts
import { Controller, useForm } from "react-hook-form";
import { Input, Select } from "antd";

type FormShape = { displayName: string; language: string };

export const ProfileForm = () => {
  const { control, handleSubmit } = useForm<FormShape>();

  const onSubmit = (data: FormShape) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="displayName"
        render={({ field }) => <Input {...field} />}
      />
      <Controller
        control={control}
        name="language"
        render={({ field }) => <Select {...field} options={LANGUAGES} />}
      />
      <button type="submit">{t("Save")}</button>
    </form>
  );
};
```

Canonical reference: `src/common/feature/login/containers/new-profile-form.tsx`.

## Validation source of truth

Validation rules go into the `Controller`'s `rules` prop, not antd's `Form.Item` rules. react-hook-form is the source of truth; antd's form layer is bypassed for state. (You can still use antd's `Form.Item` for layout/error display, just don't put validation there.)

## i18n — next-i18next

Every user-facing string goes through `useTranslation("common")`. No bare string literals in JSX, no `alt=` / `title=` / `placeholder=` strings hardcoded.

```ts
import { useTranslation } from "next-i18next";

const { t } = useTranslation("common");
return <WSButton>{t("Save")}</WSButton>;
```

## The English string IS the key

Translation keys are the English string verbatim. Add new keys only to `public/locales/en/common.json`:

```json
{
  "Save": "Save",
  "Display name": "Display name",
  "Hello {{name}}": "Hello {{name}}"
}
```

The other 8 locales (`es-ES`, `fa-IR`, `fr-FR`, `ja-JP`, `pt-BR`, `vi-VN`, `zh-TW`, `zh-CN`) live alongside `en/`. **Leave new keys missing in non-English locales** — translators fill them in. Don't guess translations.

## Interpolation

Use named placeholders, never string concatenation:

```ts
t("Hello {{name}}", { name }); // ✅
t("Hello ") + name;             // ❌ — fragments can't be translated
```

For pluralization use i18next's `_one` / `_other` suffixes if you need it; check the existing locale files first to see whether the project already uses plurals.

## Extension `_locales/` vs `public/locales/`

`extension-statics/_locales/` (Chrome `messages.json` format) is for **manifest-visible** strings only — the extension name, description, and toolbar tooltip that Chrome shows in the extension store and browser chrome. **Almost all extension UI uses the same `public/locales/` setup as the web app.** Don't duplicate strings across both.

## When you change X, also check Y

| If you change… | Also verify… |
|---|---|
| Add a new locale key | Added to `public/locales/en/common.json`, not elsewhere |
| Change an English string | The key changes too (key = English string), so all references and other locales need to be updated or accept fallback |
| Rename a form field | `useForm<FormShape>` type updated and matching `Controller` `name` props updated |
| Add a new form | `react-hook-form` + `Controller` + antd input — no bare `<input>` |

## Anti-patterns

- **Don't** bind a raw `<input>` to a form. **Do** use `Controller` wrapping an antd `Input` / `Select`.
- **Don't** write inline strings in JSX. **Do** wrap them in `t("...")`.
- **Don't** concatenate translated fragments. **Do** use `{{name}}` interpolation.
- **Don't** add translations to non-English locales by hand. Leave them missing.
- **Don't** add UI strings to `extension-statics/_locales/`. That's for the manifest only.
- **Don't** put validation rules in antd's `Form.Item`. They go in `Controller.rules`.
