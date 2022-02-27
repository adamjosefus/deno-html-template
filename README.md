> 💬 Code was moved to **repository [allo_view](https://github.com/adamjosefus/allo_views)**. Now is part of the **🦕 Allo family**.

---

# deno-html-template

Knihovna na zpracovávání `html` stringů. Umožňuje přidavat proměnné, ty escapovat a filtrovat.

```ts
// main.ts

const engine = new Template();

const s = tm.render('./template.html', {
    'myValue': "Moje hodnota <3",
    'addSalt': (path: string) => `${path}?v=${(new Date()).getTime()}`,
});
```


```html
<!-- template.html -->

<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
</head>
<body>

{$myValue}

<script src='{$addSalt("my-path-to-file.js")}'></script>

</body>
</html>
```
