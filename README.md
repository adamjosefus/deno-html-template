# deno-html-template

Knihovna na zpracovávání `html` stringů. UmožnŃuje přidavat proměnné, ty escapovat a filtrovat.

```ts
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

<script src="{$addSalt('my-path-to-file.js')}"></script>

</body>
</html>
```