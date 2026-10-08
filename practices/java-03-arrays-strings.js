// Курс «Основы Java и ООП». Урок 3.
Trainer.add({
  id: 'java-03-arrays-strings',
  title: 'Java 3. Массивы и строки',
  subject: 'Java',
  description: 'Одномерные, двумерные и «рваные» массивы, класс Arrays, массивы как ссылочный тип; String и пул строк, == против equals, методы строк и StringBuilder.',
  lesson: `## Массивы: зачем и как

Массив — это набор элементов **одного типа** фиксированной длины, к которым обращаются по номеру (индексу). Вместо ста переменных \`score1\`, \`score2\`… заводим один массив \`scores\` и обрабатываем его в цикле.

### Объявление и создание

\`\`\`java
int[] a;                    // объявили переменную-ссылку, массива ещё нет
a = new int[5];             // создали массив из 5 элементов: [0, 0, 0, 0, 0]
int[] b = {3, 1, 4};        // создание с инициализатором (только при объявлении!)
int[] c = new int[]{3, 1, 4}; // то же, работает и в присваивании, и как аргумент
int d[] = {1, 2};           // стиль C — допустим, но в Java так не пишут
\`\`\`

Типичные ошибки компиляции:

\`\`\`java
int[] x = new int[3]{1, 2, 3}; // нельзя одновременно указать размер и элементы
int[] y = new int[];           // не указан размер
int[] z;
z = {1, 2};                    // краткий {…} — только при объявлении; нужно new int[]{1, 2}
\`\`\`

Размер задаётся при создании и **больше не меняется**. Он может быть переменной (\`new int[n]\`), может быть нулевым (\`new int[0]\` — пустой массив), но отрицательный размер даст при запуске \`NegativeArraySizeException\`.

### Значения по умолчанию

Элементы нового массива автоматически заполняются значениями по умолчанию:

| Тип элементов | Значение |
|---|---|
| \`int\`, \`long\`, \`byte\`, \`short\` | \`0\` |
| \`double\`, \`float\` | \`0.0\` |
| \`boolean\` | \`false\` |
| \`char\` | \`'\\u0000'\` (символ с кодом 0) |
| ссылочные (\`String\`, массивы, объекты) | \`null\` |

### Индексы и длина

Индексы начинаются с **0**, последний элемент — \`a[a.length - 1]\`. Длина массива — это **поле** \`length\` без скобок (у строки, наоборот, метод \`length()\`). Изменить \`length\` нельзя.

\`\`\`java
int[] a = {10, 20, 30};
System.out.println(a.length);     // выведет: 3
System.out.println(a[0] + a[2]);  // выведет: 40
System.out.println(a[3]);         // ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3
\`\`\`

> ⚠️ Подвох: выход за границу массива — ошибка **времени выполнения**, а не компиляции. Компилятор не проверяет индексы, программа падает с \`ArrayIndexOutOfBoundsException\`.

### Перебор: for и for-each

\`\`\`java
int[] a = {1, 2, 3};
for (int i = 0; i < a.length; i++) {
    a[i] *= 10;                 // меняет массив: [10, 20, 30]
}
for (int x : a) {               // for-each: «для каждого x из a»
    System.out.print(x + " ");  // выведет: 10 20 30
}
\`\`\`

for-each удобен для чтения, но в нём нет индекса, а переменная цикла — **копия** элемента:

\`\`\`java
for (int x : a) {
    x = 0;      // меняется только локальная копия, массив не изменится!
}
\`\`\`

## Массив — ссылочный тип

Переменная массива хранит не сами элементы, а **ссылку** (адрес) на объект-массив в памяти (куче). Поэтому присваивание копирует ссылку, а не данные:

\`\`\`java
int[] a = {1, 2, 3};
int[] b = a;          // b указывает на ТОТ ЖЕ массив
b[0] = 100;
System.out.println(a[0]);  // выведет: 100
\`\`\`

Аналогия: массив — это дом, а переменная — бумажка с адресом. \`b = a\` переписывает адрес на вторую бумажку; дом остаётся один.

Как сравнить и скопировать:

\`\`\`java
int[] x = {1, 2, 3};
int[] y = {1, 2, 3};
System.out.println(x == y);                 // false — разные объекты
System.out.println(x.equals(y));            // false — у массивов equals тоже сравнивает ссылки!
System.out.println(Arrays.equals(x, y));    // true  — сравнение содержимого
int[] copy = x.clone();                     // независимая копия
int[] longer = Arrays.copyOf(x, 5);         // [1, 2, 3, 0, 0]
\`\`\`

> ⚠️ Подвох: \`System.out.println(x)\` печатает не элементы, а что-то вроде \`[I@1b6d3586\` (тип и хеш объекта). Для вывода содержимого — \`Arrays.toString(x)\`.

## Класс java.util.Arrays

Нужен импорт: \`import java.util.Arrays;\`.

| Метод | Что делает |
|---|---|
| \`Arrays.toString(a)\` | строка вида \`[1, 2, 3]\` |
| \`Arrays.sort(a)\` | сортирует массив **на месте** (ничего не возвращает) |
| \`Arrays.fill(a, 7)\` | заполняет все элементы значением |
| \`Arrays.copyOf(a, n)\` | новый массив длины n: лишнее обрезается, недостающее — значения по умолчанию |
| \`Arrays.copyOfRange(a, from, to)\` | копия элементов с from (включительно) до to (не включительно) |
| \`Arrays.equals(a, b)\` | сравнивает содержимое |
| \`Arrays.deepToString(m)\` | вывод двумерного массива |
| \`Arrays.binarySearch(a, key)\` | двоичный поиск — только в **отсортированном** массиве |

## Двумерные и «рваные» массивы

Двумерный массив в Java — это **массив массивов**: каждый элемент внешнего массива — ссылка на строку.

\`\`\`java
int[][] m = new int[3][4];      // 3 строки по 4 столбца
m[1][2] = 5;
System.out.println(m.length);    // выведет: 3 — число строк
System.out.println(m[0].length); // выведет: 4 — длина строки 0

int[][] g = {{1, 2, 3}, {4, 5}, {6}};  // строки разной длины — «рваный» массив
for (int i = 0; i < g.length; i++) {
    for (int j = 0; j < g[i].length; j++) {  // длина КАЖДОЙ строки своя
        System.out.print(g[i][j] + " ");
    }
    System.out.println();
}
\`\`\`

Можно создать только внешний массив, а строки — потом:

\`\`\`java
int[][] tri = new int[3][];      // строки пока null!
for (int i = 0; i < tri.length; i++) {
    tri[i] = new int[i + 1];     // длины 1, 2, 3
}
System.out.println(Arrays.deepToString(tri)); // выведет: [[0], [0, 0], [0, 0, 0]]
\`\`\`

> ⚠️ Подвох: после \`new int[2][]\` элементы внешнего массива равны \`null\`, поэтому \`m[0].length\` бросит \`NullPointerException\`. А запись \`new int[][3]\` вообще не компилируется — первым указывается размер внешнего массива.

## Строки: класс String

\`String\` — ссылочный тип (класс), а не примитив. Главное свойство строк — **неизменяемость** (immutability): ни один метод не меняет существующую строку, все методы возвращают **новую**.

\`\`\`java
String s = "java";
s.toUpperCase();          // результат выброшен!
System.out.println(s);    // выведет: java
s = s.toUpperCase();      // правильно: сохранить результат
System.out.println(s);    // выведет: JAVA
\`\`\`

Зачем неизменяемость: строки можно безопасно передавать куда угодно и хранить как ключи; их можно разделять между потоками и **переиспользовать** — на этом построен пул строк.

### Пул строк и == против equals

Строковые литералы хранятся в **пуле строк**: одинаковые литералы — это один и тот же объект. \`new String(...)\` всегда создаёт новый объект.

- \`==\` сравнивает **ссылки**: один ли это объект;
- \`equals\` сравнивает **содержимое**: одинаковые ли символы;
- \`equalsIgnoreCase\` — содержимое без учёта регистра.

\`\`\`java
String a = "hello";
String b = "hello";
String c = new String("hello");
String d = "hel" + "lo";     // константы склеиваются при компиляции → литерал "hello"
String part = "hel";
String e = part + "lo";      // склейка при выполнении → новый объект

System.out.println(a == b);       // true  — один объект из пула
System.out.println(a == c);       // false — c создан через new
System.out.println(a == d);       // true  — d — тот же литерал
System.out.println(a == e);       // false — e создан во время выполнения
System.out.println(a.equals(c));  // true  — символы одинаковые
System.out.println(a.equals(e));  // true
\`\`\`

> 💡 Запомни: строки **всегда** сравнивают через \`equals\`. Результат \`==\` зависит от того, откуда взялась строка, — на этом построены задачи-ловушки. Если строка может быть \`null\`, пишите константу слева: \`"yes".equals(answer)\` — это не бросит \`NullPointerException\`.

Если переменная объявлена как \`final String part = "hel";\`, она становится константой времени компиляции, и \`part + "lo" == "hello"\` уже даст \`true\`. Метод \`intern()\` возвращает строку из пула.

### Основные методы String

Пусть \`String s = "Hello, World";\` (индексы: H=0, e=1, … W=7, o=8).

| Метод | Пример | Результат |
|---|---|---|
| \`length()\` | \`s.length()\` | \`12\` |
| \`charAt(i)\` | \`s.charAt(7)\` | \`'W'\` |
| \`substring(from, to)\` | \`s.substring(7, 10)\` | \`"Wor"\` — to не включается |
| \`substring(from)\` | \`s.substring(7)\` | \`"World"\` |
| \`indexOf(x)\` | \`s.indexOf('o')\`, \`s.indexOf("z")\` | \`4\` и \`-1\` (не найдено) |
| \`lastIndexOf(x)\` | \`s.lastIndexOf('o')\` | \`8\` |
| \`contains(x)\` | \`s.contains("World")\` | \`true\` |
| \`startsWith\` / \`endsWith\` | \`s.startsWith("He")\` | \`true\` |
| \`toUpperCase()\` / \`toLowerCase()\` | \`s.toLowerCase()\` | \`"hello, world"\` |
| \`replace(a, b)\` | \`"banana".replace('a', 'o')\` | \`"bonono"\` — заменяет **все** |
| \`trim()\` / \`strip()\` | \`"  hi  ".trim()\` | \`"hi"\` |
| \`split(regex)\` | \`"a,b,c".split(",")\` | массив \`["a", "b", "c"]\` |
| \`isEmpty()\` / \`isBlank()\` | \`"  ".isBlank()\` | \`true\` |
| \`equals\` / \`equalsIgnoreCase\` | \`"Java".equalsIgnoreCase("JAVA")\` | \`true\` |
| \`compareTo\` | \`"abc".compareTo("abd")\` | отрицательное число |
| \`String.join\`, \`repeat\` | \`"ab".repeat(3)\` | \`"ababab"\` |
| \`toCharArray()\` | \`"hi".toCharArray()\` | \`['h', 'i']\` |

Неверный индекс в \`charAt\` или \`substring\` — \`StringIndexOutOfBoundsException\`.

> ⚠️ Подвох: \`split\` принимает **регулярное выражение**. Точка в регулярках означает «любой символ», поэтому \`"a.b.c".split(".")\` возвращает **пустой** массив. Нужно экранировать: \`split("\\\\.")\`. Кроме того, \`split\` отбрасывает пустые строки в **конце**: \`"a,b,,c,".split(",")\` даёт \`[a, b, , c]\` — 4 элемента.

Преобразования: \`Integer.parseInt("42")\` → число 42; \`String.valueOf(42)\` или \`"" + 42\` → строка "42".

## char как число

\`char\` хранит код символа, поэтому символы можно сравнивать и вычитать. Это основа множества задач:

\`\`\`java
char c = 'a';
System.out.println(c + 1);            // выведет: 98
System.out.println((char) (c + 1));   // выведет: b
System.out.println('7' - '0');        // выведет: 7 — цифра-символ → число
System.out.println("Hello".charAt(1) + "Hello".charAt(4)); // выведет: 212 (101 + 111)!

int[] counts = new int[26];           // частоты латинских букв
for (char ch : "banana".toCharArray()) {
    counts[ch - 'a']++;               // 'a' → 0, 'b' → 1, ...
}
System.out.println(counts[0]);        // выведет: 3 (три буквы a)
\`\`\`

Полезные методы класса \`Character\`: \`isDigit\`, \`isLetter\`, \`isLetterOrDigit\`, \`isWhitespace\`, \`toUpperCase\`, \`toLowerCase\`.

## StringBuilder

Раз строки неизменяемы, каждое \`s = s + x\` создаёт **новую** строку и копирует в неё все старые символы. В цикле из n шагов это n копирований всё более длинных строк — время растёт примерно как n². \`StringBuilder\` — **изменяемая** строка: он дописывает символы в свой внутренний буфер без создания новых объектов.

\`\`\`java
// Медленно: каждая итерация создаёт новую строку
String s = "";
for (int i = 0; i < 10000; i++) {
    s += i;
}

// Быстро: один изменяемый объект
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);
}
String result = sb.toString();
\`\`\`

Основные методы (большинство возвращают тот же \`StringBuilder\`, поэтому их можно вызывать цепочкой):

\`\`\`java
StringBuilder sb = new StringBuilder("hello");
sb.append(" world");     // hello world
sb.insert(0, ">> ");     // >> hello world
sb.reverse();            // dlrow olleh >>
sb.setCharAt(0, 'D');    // Dlrow olleh >>  (void — в цепочку не встраивается)
sb.deleteCharAt(0);      // lrow olleh >>
System.out.println(sb.length());   // выведет: 13
String done = sb.toString();
\`\`\`

> ⚠️ Подвох: \`StringBuilder\` **не** переопределяет \`equals\`, поэтому \`new StringBuilder("hi").equals(new StringBuilder("hi"))\` — \`false\`. Сравнивайте \`sb1.toString().equals(sb2.toString())\`. Также \`StringBuilder sb = "abc";\` не скомпилируется — это разные типы. Есть ещё \`StringBuffer\` — то же самое, но с синхронизацией для многопоточности (и медленнее).

Одиночная склейка вида \`"Имя: " + name + ", возраст: " + age\` — это нормально, компилятор оптимизирует её сам. StringBuilder нужен прежде всего **в циклах**.

## Шпаргалка

| Что | Как |
|---|---|
| длина массива / строки | \`a.length\` / \`s.length()\` |
| вывод массива | \`Arrays.toString(a)\`, \`Arrays.deepToString(m)\` |
| сравнение массивов | \`Arrays.equals(a, b)\`, не \`==\` и не \`equals\` |
| копия массива | \`a.clone()\`, \`Arrays.copyOf(a, n)\` |
| \`b = a\` для массивов | копируется ссылка, массив общий |
| for-each | переменная — копия элемента |
| сравнение строк | \`equals\` / \`equalsIgnoreCase\`, не \`==\` |
| изменить строку | нельзя — метод возвращает новую строку |
| \`substring(a, b)\` | символы с a по b − 1 |
| \`indexOf\` не нашёл | \`-1\` |
| склейка в цикле | \`StringBuilder.append\` |
| цифра-символ → число | \`ch - '0'\` |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Какие строки **скомпилируются**? Отметьте все.',
      options: [
        '`int[] a = new int[3];`',
        '`int a[] = {1, 2};`',
        '`int[] b = new int[3]{1, 2, 3};`',
        '`int[] c = new int[];`',
        '`int[] d; d = {1, 2};`',
        '`int[] e = new int[]{1, 2};`',
        '`int[] f = new int[0];`',
      ],
      answer: ['`int[] a = new int[3];`', '`int a[] = {1, 2};`', '`int[] e = new int[]{1, 2};`', '`int[] f = new int[0];`'],
      explain: 'Нельзя одновременно задать размер и список элементов; нельзя создать массив без размера и без элементов; краткую форму `{1, 2}` можно использовать только при объявлении переменной. Массив нулевой длины — законный пустой массив.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\ndouble[] d = new double[2];\nboolean[] f = new boolean[2];\nString[] s = new String[2];\nSystem.out.println(d[0] + " " + f[1] + " " + s[0]);\n```',
      answer: '0.0 false null',
      explain: 'Элементы нового массива получают значения по умолчанию: 0.0 для double, false для boolean и null для ссылочных типов (String — ссылочный тип).',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nint[] a = {1, 2, 3};\nSystem.out.println(a[3]);\n```',
      options: ['Выведет `3`', 'Выведет `0`', 'Ошибка компиляции', '`ArrayIndexOutOfBoundsException` при выполнении'],
      answer: '`ArrayIndexOutOfBoundsException` при выполнении',
      explain: 'Индексы массива из трёх элементов — 0, 1, 2. Компилятор индексы не проверяет, поэтому код компилируется, но при выполнении JVM бросает исключение.',
    },
    {
      type: 'gaps',
      q: 'Выберите правильный способ узнать длину',
      code: true,
      text: 'int[] arr = {3, 1, 4};\nString s = "java";\nint n1 = arr.[*length|length()|size()];\nint n2 = s.[*length()|length|size()];',
      explain: 'У массива длина — поле `length` (без скобок), у строки — метод `length()`. Метод `size()` есть у коллекций (ArrayList и др.), но не у массивов и строк.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nint[] a = {1, 2, 3};\nint[] b = a;\nb[0] = 100;\nSystem.out.println(a[0]);\n```',
      answer: '100',
      explain: '`b = a` копирует ссылку, а не массив. Обе переменные указывают на один и тот же объект, поэтому изменение через `b` видно через `a`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nint[] a = {1, 2, 3};\nfor (int x : a) {\n    x *= 10;\n}\nSystem.out.println(Arrays.toString(a));\n```',
      answer: ['[1, 2, 3]', '1, 2, 3'],
      explain: 'В for-each переменная `x` — копия очередного элемента. Изменение копии на массив не влияет. Чтобы изменить элементы, нужен обычный for с индексом: `a[i] *= 10`.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nint[] a = {1, 2, 3};\nint[] b = {1, 2, 3};\nSystem.out.println((a == b) + " " + a.equals(b) + " " + Arrays.equals(a, b));\n```',
      options: ['`true true true`', '`false false true`', '`false true true`', '`true false true`'],
      answer: '`false false true`',
      explain: '`a` и `b` — разные объекты, поэтому `==` даёт false. Массивы не переопределяют `equals`, он сравнивает ссылки так же, как `==`. Содержимое сравнивает `Arrays.equals`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nint[] a = {5, 3, 9};\nint[] b = Arrays.copyOf(a, 5);\nArrays.sort(a);\nSystem.out.println(Arrays.toString(a) + Arrays.toString(b));\n```',
      answer: '[3, 5, 9][5, 3, 9, 0, 0]',
      explain: '`copyOf` создаёт **новый** массив длины 5, недостающие элементы — нули. Сортировка `a` на копию `b` не влияет. `Arrays.sort` сортирует сам массив и ничего не возвращает.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nint[] arr = {1, 2, 3};\nSystem.out.println(arr);\n```',
      options: ['`[1, 2, 3]`', 'что-то вроде `[I@1b6d3586`', '`123`', 'Ошибка компиляции'],
      answer: 'что-то вроде `[I@1b6d3586`',
      explain: 'У массива нет «красивого» `toString`: печатается тип (`[I` — массив int) и хеш-код объекта. Для вывода элементов — `Arrays.toString(arr)`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nint[][] m = new int[2][];\nSystem.out.println(m[0].length);\n```',
      options: ['Выведет `0`', 'Выведет `null`', '`NullPointerException`', 'Ошибка компиляции'],
      answer: '`NullPointerException`',
      explain: 'Создан только внешний массив из двух ссылок, обе равны `null`. Обращение к `length` у `null` даёт `NullPointerException`. Строки нужно создать отдельно: `m[0] = new int[5];`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nint[][] g = {{1, 2, 3}, {4, 5}, {6}};\nSystem.out.println(g[1][1] + g[2][0] + g.length);\n```',
      answer: '14',
      explain: '`g[1][1]` = 5 (строка {4, 5}), `g[2][0]` = 6, `g.length` = 3 (число строк). 5 + 6 + 3 = 14 — здесь нет строк, поэтому `+` складывает числа.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nString s = "java";\ns.toUpperCase();\ns.concat("!");\nSystem.out.println(s);\n```',
      options: ['`java`', '`JAVA`', '`JAVA!`', '`java!`'],
      answer: '`java`',
      explain: 'Строки неизменяемы: `toUpperCase` и `concat` возвращают **новые** строки, а результат здесь никуда не сохранён. Правильно: `s = s.toUpperCase();`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\nString a = "hello";\nString b = "hello";\nString c = new String("hello");\nString d = "hel" + "lo";\nSystem.out.println((a == b) + " " + (a == c) + " " + (a == d) + " " + a.equals(c));\n```',
      answer: 'true false true true',
      explain: '`a` и `b` — один литерал из пула строк. `new String` всегда создаёт новый объект. `"hel" + "lo"` склеивается ещё при компиляции и становится литералом `"hello"` из пула. `equals` сравнивает содержимое.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nString part = "hel";\nString e = part + "lo";\nSystem.out.println(e == "hello");\n```',
      options: ['`true`', '`false`', 'Ошибка компиляции'],
      answer: '`false`',
      explain: '`part` — обычная переменная, поэтому склейка выполняется во время работы программы и создаёт новый объект вне пула. Если объявить `final String part = "hel";`, выражение станет константой и результат будет `true`. Вывод: строки сравнивают через `equals`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nString s = "Hello, World";\nSystem.out.println(s.substring(7, 10) + s.indexOf(\'o\') + s.lastIndexOf("o") + s.indexOf("z"));\n```',
      answer: 'Wor48-1',
      hint: 'Пробел и запятая — тоже символы со своими индексами.',
      explain: 'Индексы: H0 e1 l2 l3 o4 ,5 _6 W7 o8 r9 l10 d11. `substring(7, 10)` — символы 7, 8, 9: "Wor". Первая `o` — 4, последняя — 8, `z` нет — -1. Всё склеивается в строку: "Wor" + 4 + 8 + -1.',
    },
    {
      type: 'choice',
      q: 'Что выведет `System.out.println("a.b.c".split(".").length);`?',
      options: ['`3`', '`0`', '`1`', '`5`', 'Ошибка компиляции'],
      answer: '`0`',
      explain: '`split` принимает регулярное выражение, а `.` в нём — «любой символ». Все символы оказываются разделителями, получаются только пустые строки, а пустые строки в конце результата отбрасываются. Правильно: `split("\\\\.")`.',
    },
    {
      type: 'input',
      q: 'Чему равно `"a,b,,c,".split(",").length`?',
      answer: '4',
      explain: 'Результат — `[a, b, , c]`: пустая строка между двумя запятыми сохраняется, а пустые строки в **конце** `split` отбрасывает.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\nSystem.out.println("  Ja va  ".trim().length() + " " + "banana".replace(\'a\', \'o\') + " " + "banana".indexOf("an", 2));\n```',
      answer: '5 bonono 3',
      explain: '`trim` убирает пробелы только по краям: остаётся "Ja va" — 5 символов. `replace` заменяет **все** вхождения. `indexOf("an", 2)` ищет начиная с индекса 2: b0 a1 n2 a3 n4 a5 — ближайшее "an" начинается с 3.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nSystem.out.println("Hello".charAt(1) + "Hello".charAt(4));\n```',
      options: ['`eo`', '`212`', '`Ho`', 'Ошибка компиляции'],
      answer: '`212`',
      explain: '`charAt` возвращает `char`, а `char + char` — это сложение кодов: \'e\' (101) + \'o\' (111) = 212. Строки в выражении нет. Чтобы получить "eo", начните со строки: `"" + s.charAt(1) + s.charAt(4)`.',
    },
    {
      type: 'gaps',
      q: 'Допишите подсчёт частот строчных латинских букв в слове',
      code: true,
      text: 'int\\[] counts = new int\\[26];\nfor (char c : word.[toCharArray]()) {\n    counts\\[c - [\'a\'|97]]++;\n}',
      explain: '`toCharArray()` превращает строку в массив символов. `c - \'a\'` даёт номер буквы в алфавите: \'a\' → 0, \'b\' → 1, …, \'z\' → 25.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nStringBuilder a = new StringBuilder("hi");\nStringBuilder b = new StringBuilder("hi");\nSystem.out.println(a.equals(b) + " " + a.toString().equals(b.toString()));\n```',
      options: ['`true true`', '`false true`', '`false false`', '`true false`'],
      answer: '`false true`',
      explain: '`StringBuilder` не переопределяет `equals` и сравнивает ссылки, как `==`. Содержимое сравнивают через `toString()` и `String.equals`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\nStringBuilder sb = new StringBuilder("java");\nsb.append(17).insert(0, \'<\').reverse();\nSystem.out.println(sb + " " + sb.length());\n```',
      answer: '71avaj< 7',
      explain: '"java" → append(17) → "java17" → insert(0, \'<\') → "<java17" → reverse() → "71avaj<". Методы меняют сам объект и возвращают его же, поэтому их можно вызывать цепочкой. Длина 7.',
    },
    {
      type: 'match',
      q: 'Дана строка `String s = "Programming";`. Соедините выражение и результат',
      pairs: [
        ['`s.length()`', '11'],
        ['`s.charAt(0)`', 'P'],
        ['`s.indexOf(\'m\')`', '6'],
        ['`s.lastIndexOf(\'g\')`', '10'],
        ['`s.substring(3, 7)`', 'gram'],
        ['`s.contains("Pro")`', 'true'],
      ],
      explain: 'P0 r1 o2 g3 r4 a5 m6 m7 i8 n9 g10. `substring(3, 7)` берёт символы 3–6.',
    },
    {
      type: 'flashcard',
      front: 'Почему склеивать строки через `+=` в цикле медленно и что использовать вместо этого?',
      back: '`String` неизменяем: каждое `s += x` создаёт новую строку и копирует в неё все символы старой. За n итераций копируется 1 + 2 + … + n символов — время растёт как n². `StringBuilder` изменяемый: `append` дописывает во внутренний буфер. В конце — `sb.toString()`.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Чем `==` отличается от `equals` для строк? Как безопасно сравнить строку, которая может быть `null`?',
      back: '`==` сравнивает ссылки (один ли объект), `equals` — содержимое. Строки всегда сравнивают через `equals`. Если переменная может быть null, константу ставят слева: `"yes".equals(answer)` — вернёт false вместо NullPointerException.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Переверните массив `a` **на месте** (без создания второго массива) и выведите его через `Arrays.toString`. Для `{1, 2, 3, 4, 5}` должно получиться `[5, 4, 3, 2, 1]`.',
      starter: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5};
        // ваш код
        System.out.println(Arrays.toString(a));
    }
}`,
      solution: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5};
        for (int i = 0, j = a.length - 1; i < j; i++, j--) {
            int tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        System.out.println(Arrays.toString(a));
    }
}`,
      hint: 'Два индекса: один идёт с начала, другой с конца. Меняйте элементы местами, пока индексы не встретятся.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Программа читает строку и выводит `true`, если это палиндром без учёта регистра, пробелов и знаков препинания, иначе `false`. Для «А роза упала на лапу Азора» ответ `true`.',
      starter: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        // ваш код
    }
}`,
      solution: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                sb.append(Character.toLowerCase(c));
            }
        }
        String clean = sb.toString();
        String reversed = new StringBuilder(clean).reverse().toString();
        System.out.println(clean.equals(reversed));
    }
}`,
      hint: 'Соберите в StringBuilder только буквы и цифры в нижнем регистре, затем сравните строку с её перевёрнутой копией через `equals`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Сожмите строку из строчных букв: подряд идущие одинаковые символы замените на символ и количество повторов. Например, `aaabccdddd` → `a3b1c2d4`. Используйте `StringBuilder`.',
      starter: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        // ваш код
    }
}`,
      solution: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        StringBuilder sb = new StringBuilder();
        int count = 1;
        for (int i = 1; i <= s.length(); i++) {
            if (i < s.length() && s.charAt(i) == s.charAt(i - 1)) {
                count++;
            } else {
                sb.append(s.charAt(i - 1)).append(count);
                count = 1;
            }
        }
        System.out.println(sb);
    }
}`,
      hint: 'Идите по строке и считайте длину текущей серии. Когда символ сменился (или строка кончилась) — допишите символ и счётчик.',
    },
  ],
});
