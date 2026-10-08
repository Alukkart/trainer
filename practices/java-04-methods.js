// Курс «Основы Java и ООП». Урок 4.
Trainer.add({
  id: 'java-04-methods',
  title: 'Java 4. Методы',
  subject: 'Java',
  description: 'Статические методы, return и void, перегрузка и правила выбора метода, передача параметров только по значению, рекурсия, varargs и область видимости переменных.',
  lesson: `## Зачем нужны методы

Метод — это именованный блок кода, который можно вызывать много раз. Аналогия — рецепт: один раз записали «как приготовить омлет», а дальше просто говорим «приготовь омлет из 3 яиц». Методы позволяют:

- **не повторяться** (принцип DRY — Don't Repeat Yourself): исправили ошибку в одном месте — она исправлена везде;
- **разбивать задачу на части**: \`main\` читается как план — прочитать данные, посчитать, вывести;
- **давать понятные имена** действиям: \`isPrime(n)\` понятнее десятка строк с циклами.

## Объявление и вызов

\`\`\`java
public class Main {
    //  модификатор  тип результата  имя   параметры
    static          int             max(int a, int b) {
        return a > b ? a : b;     // тело метода
    }

    public static void main(String[] args) {
        int m = max(3, 7);              // вызов: аргументы 3 и 7
        System.out.println(m);          // выведет: 7
        System.out.println(max(m, 10)); // выведет: 10
    }
}
\`\`\`

Пока мы пишем методы со словом \`static\` — они принадлежат классу, и их можно вызывать прямо из \`main\` без создания объектов. Из другого класса статический метод вызывают через имя класса: \`Main.max(1, 2)\`, \`Math.max(1, 2)\`. Методы без \`static\` (методы объектов) появятся в уроке про классы. Если такой метод вызвать из статического \`main\` просто по имени, будет ошибка *non-static method cannot be referenced from a static context*.

Методы объявляются только внутри класса и **не могут быть вложены** друг в друга. Порядок методов в классе не важен: можно вызывать метод, объявленный ниже.

## return и void

\`return\` завершает метод и возвращает значение вызывающему коду. Тип значения должен соответствовать типу результата (допускается расширение: из метода \`double\` можно вернуть \`int\`).

Если метод ничего не возвращает, его тип — \`void\`. В нём можно написать \`return;\` без значения, чтобы выйти досрочно:

\`\`\`java
static void printPositive(int x) {
    if (x <= 0) {
        return;              // досрочный выход
    }
    System.out.println(x);
}
\`\`\`

Компилятор строго проверяет, что метод с типом результата возвращает значение **на любом пути выполнения**:

\`\`\`java
static int sign(int x) {
    if (x > 0) return 1;
    else if (x < 0) return -1;
}   // ошибка: missing return statement — а если x == 0?

static int sign2(int x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0;                // теперь все пути покрыты
}
\`\`\`

Ещё ошибки: \`return 5;\` в \`void\`-методе (*unexpected return value*) и код сразу после \`return\` (*unreachable statement*). Любопытное исключение: \`static int f() { while (true) { } }\` компилируется — из бесконечного цикла без \`break\` метод никогда не выходит «по-обычному», значит, \`return\` не нужен.

Результат метода можно не использовать: вызов \`max(1, 2);\` отдельной строкой допустим (хоть и бесполезен).

### Параметры и аргументы

**Параметры** (формальные параметры) — переменные в объявлении: \`int a, int b\`. **Аргументы** — конкретные значения при вызове: \`max(3, 7)\`. Перед вызовом аргументы вычисляются **слева направо**, затем их значения копируются в параметры. Внутри метода параметры — обычные локальные переменные.

## Сигнатура и перегрузка методов

**Сигнатура** метода — это его имя плюс список типов параметров (их количество, типы и порядок). В сигнатуру **не входят** тип результата, имена параметров и модификаторы.

**Перегрузка** (overloading) — несколько методов с одним именем, но разными списками параметров. Пример из библиотеки — \`System.out.println\`: есть версии для \`int\`, \`double\`, \`char\`, \`String\`, \`Object\` и т.д.

\`\`\`java
static int area(int side) { return side * side; }                // квадрат
static int area(int w, int h) { return w * h; }                  // прямоугольник
static double area(double r) { return Math.PI * r * r; }         // круг
\`\`\`

Что **не** является перегрузкой (ошибка компиляции *method is already defined*):

\`\`\`java
static int f(int a) { ... }
static long f(int b) { ... }   // отличается только тип результата и имя параметра
static void g(int[] a) { ... }
static void g(int... a) { ... } // int... внутри — тот же int[]
\`\`\`

### Как компилятор выбирает перегруженный метод

Выбор происходит **при компиляции** по типам аргументов. Компилятор проходит фазы и останавливается на первой, где нашёлся подходящий метод:

1. **Точное совпадение** типов.
2. **Расширение примитивов** (\`byte → short → int → long → float → double\`, \`char → int\`). Если подходят несколько — выбирается самый «узкий» (самый специфичный).
3. **Автоупаковка / распаковка** (\`int ↔ Integer\` и т.п.) — затем возможно расширение ссылки до \`Object\`.
4. **Varargs** (\`int...\`) — в последнюю очередь.

\`\`\`java
static void f(long x)    { System.out.print("long "); }
static void f(Integer x) { System.out.print("Integer "); }
static void f(int... x)  { System.out.print("varargs "); }

f(5);                   // выведет: long    — расширение int → long важнее упаковки
byte b = 1;
f(b);                   // выведет: long    — byte → long
f(Integer.valueOf(5));  // выведет: Integer — точное совпадение
f();                    // выведет: varargs — подходит только varargs
\`\`\`

Ещё пример: для \`show(int)\`, \`show(double)\`, \`show(Object)\` вызов \`show('A')\` выберет \`int\` (char → int), \`show(5L)\` — \`double\` (long → double), \`show("5")\` — \`Object\`.

> ⚠️ Подвох: расширение и упаковка не комбинируются в обратном порядке. Для метода \`g(Long x)\` вызов \`g(5)\` **не компилируется**: \`int\` упаковывается только в \`Integer\`, а \`Integer\` — не \`Long\`. Нужно \`g(5L)\`.

> ⚠️ Подвох с null: для \`p(Object)\` и \`p(String)\` вызов \`p(null)\` выберет \`String\` — он более специфичный (String — частный случай Object). А для \`q(Integer)\` и \`q(String)\` вызов \`q(null)\` — ошибка компиляции *reference to q is ambiguous*: ни один тип не «уже» другого.

Неоднозначность бывает и с примитивами: методы \`m(int, long)\` и \`m(long, int)\` спокойно объявляются, но вызов \`m(1, 1)\` не скомпилируется — оба одинаково подходят.

## Передача параметров: только по значению

Это один из самых частых вопросов на собеседованиях. В Java аргументы **всегда передаются по значению**: в параметр копируется значение переменной.

**Примитив** — копируется само число. Метод работает с копией, оригинал не меняется:

\`\`\`java
static void inc(int x) { x++; }

int a = 5;
inc(a);
System.out.println(a);   // выведет: 5
\`\`\`

**Ссылочный тип** (массив, StringBuilder, объект) — копируется **значение ссылки**, то есть адрес. Копия адреса указывает на **тот же** объект. Поэтому:

- изменить **содержимое** объекта через параметр можно — изменения видны снаружи;
- **переназначить** параметр на другой объект можно, но снаружи этого не видно — меняется только локальная копия адреса.

\`\`\`java
static void change(int[] arr) {
    arr[0] = 100;              // меняем объект — видно снаружи
}
static void reset(int[] arr) {
    arr = new int[]{0, 0};     // параметр теперь указывает на НОВЫЙ массив
    arr[0] = 42;               // меняем новый массив, старый не тронут
}

int[] data = {1, 2};
change(data);
System.out.println(data[0]);   // выведет: 100
reset(data);
System.out.println(data[0]);   // выведет: 100 — reset не повлиял
\`\`\`

Аналогия: вы дали другу **ксерокопию** бумажки с адресом своей квартиры. Друг может прийти и переставить мебель (изменить объект). Но если он зачеркнёт адрес на своей копии и впишет другой — ваша бумажка не изменится.

> ⚠️ Подвох: метод \`swap(int a, int b)\` не может поменять местами значения переменных вызывающего кода — он меняет только свои копии. Для той же задачи со \`String\` тоже ничего не выйдет: строку нельзя изменить (она неизменяема), а переназначение параметра \`s += "!"\` снаружи не видно. А вот \`StringBuilder\` через параметр изменить можно: \`sb.append("!")\`.

## Рекурсия

**Рекурсия** — вызов методом самого себя. Любая корректная рекурсия состоит из двух частей:

- **базовый случай** — условие, при котором метод отвечает сразу, без рекурсивного вызова;
- **рекурсивный шаг** — сведение задачи к такой же, но меньшей, с движением к базовому случаю.

\`\`\`java
static long factorial(int n) {
    if (n <= 1) {                    // базовый случай: 0! = 1! = 1
        return 1;
    }
    return n * factorial(n - 1);     // шаг: n! = n · (n-1)!
}
\`\`\`

Как это работает: каждый вызов получает **свой кадр** в стеке вызовов (свои параметры и локальные переменные). \`factorial(3)\` ждёт результат \`factorial(2)\`, тот ждёт \`factorial(1)\`, который сразу возвращает 1. Затем стек «раскручивается»: 2 · 1 = 2, 3 · 2 = 6.

Действия **до** рекурсивного вызова выполняются по пути «вниз», а **после** — на обратном пути «вверх»:

\`\`\`java
static void p(int n) {
    if (n == 0) return;
    System.out.print(n + " ");   // по пути вниз
    p(n - 1);
    System.out.print(n + " ");   // по пути вверх
}
// p(3) выведет: 3 2 1 1 2 3
\`\`\`

### Опасности рекурсии

> ⚠️ Без базового случая (или если шаг не приближает к нему) вызовы никогда не заканчиваются. Стек вызовов ограничен, и программа падает с **\`StackOverflowError\`** — это \`Error\`, а не \`Exception\`. Компилятор такую ошибку не ловит: \`static int f(int n) { return f(n + 1); }\` компилируется.

Наивная рекурсия может быть очень медленной:

\`\`\`java
static int fib(int n) {
    if (n < 2) return n;                 // fib(0) = 0, fib(1) = 1
    return fib(n - 1) + fib(n - 2);
}
\`\`\`

Каждый вызов порождает два новых, одни и те же значения пересчитываются много раз: \`fib(5)\` делает 15 вызовов, \`fib(10)\` — 177, а \`fib(40)\` — сотни миллионов. Время растёт экспоненциально. Решение — цикл или запоминание уже вычисленных значений.

Ещё ограничение: \`long\` вмещает факториалы только до 20! — \`factorial(21)\` молча переполнится и вернёт отрицательное число.

Рекурсия хороша, когда задача естественно делится на такие же подзадачи: обход деревьев и папок, «разделяй и властвуй» (быстрая сортировка), алгоритм Евклида. Любую рекурсию можно переписать циклом.

## Переменное число аргументов (varargs)

\`\`\`java
static int sum(int... nums) {   // внутри метода nums — это int[]
    int s = 0;
    for (int n : nums) {
        s += n;
    }
    return s;
}

sum();                    // 0 — передан пустой массив
sum(1, 2, 3);             // 6
sum(new int[]{4, 5});     // 9 — можно передать готовый массив
\`\`\`

Правила:

- varargs-параметр может быть **только один** и только **последним**: \`static void log(String level, Object... args)\` — можно, \`f(int... a, String s)\` — нельзя;
- при выборе перегрузки varargs рассматривается **в последнюю очередь**;
- \`main(String... args)\` — тоже корректная точка входа.

## Область видимости переменных

Локальная переменная видна **от места объявления до конца блока** \`{ }\`, в котором объявлена. Параметры видны во всём теле метода. Когда метод завершается, его локальные переменные исчезают.

\`\`\`java
public static void main(String[] args) {
    int x = 1;
    {
        int y = 2;          // y видна только в этом блоке
        int x = 3;          // ошибка! x уже объявлена во внешнем блоке
    }
    System.out.println(y);  // ошибка: y здесь не видна

    for (int i = 0; i < 3; i++) { }
    for (int i = 0; i < 3; i++) { }   // ок: прошлая i уже «умерла»
}
\`\`\`

> ⚠️ Подвох: в отличие от C++, в Java **нельзя** объявить во вложенном блоке локальную переменную с тем же именем, что у локальной переменной или параметра внешнего блока. Последовательные (не вложенные) блоки могут использовать одно имя.

Переменная, объявленная в классе со словом \`static\` (поле класса), видна во всех методах класса. Локальная переменная с тем же именем **затеняет** её внутри метода — это разрешено. К полю тогда обращаются через имя класса:

\`\`\`java
public class Main {
    static int x = 10;          // поле класса

    static void f() {
        int x = 20;             // локальная, затеняет поле
        System.out.println(x + " " + Main.x);   // выведет: 20 10
    }
}
\`\`\`

## Хороший стиль

- Имя метода — глагол в camelCase: \`calculateTotal\`, \`isEmpty\`, \`printReport\`. Методы, возвращающие boolean, часто начинают с \`is\`/\`has\`/\`can\`.
- Один метод — одна задача. Если метод не помещается на экран — его стоит разбить.
- Лучше возвращать результат, чем печатать его внутри: такой метод можно переиспользовать.

## Шпаргалка

| Тема | Главное |
|---|---|
| сигнатура | имя + типы параметров; тип результата не входит |
| перегрузка | одно имя, разные параметры; выбор при компиляции |
| порядок выбора | точное → расширение → упаковка → varargs |
| \`void\` | ничего не возвращает; \`return;\` — досрочный выход |
| нет return на каком-то пути | ошибка *missing return statement* |
| примитив в параметре | копия значения, оригинал не меняется |
| ссылка в параметре | копия адреса: объект изменить можно, переназначить нельзя |
| рекурсия | базовый случай + шаг; без базы — StackOverflowError |
| varargs \`int... a\` | внутри массив; один и последний; низший приоритет |
| область видимости | от объявления до конца блока; повторять имя во вложенном блоке нельзя |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Какие методы **скомпилируются**? Отметьте все.',
      options: [
        '`static int f() { }`',
        '`static void g() { return; }`',
        '`static int h(int x) { if (x > 0) return 1; }`',
        '`static int k(int x) { if (x > 0) return 1; else return -1; }`',
        '`static void m() { return 5; }`',
        '`static int n() { while (true) { } }`',
        '`static int s(int x) { return x; System.out.println(x); }`',
      ],
      answer: ['`static void g() { return; }`', '`static int k(int x) { if (x > 0) return 1; else return -1; }`', '`static int n() { while (true) { } }`'],
      explain: 'Метод с типом результата должен возвращать значение на любом пути: у `f` нет return вовсе, у `h` нет return при x ≤ 0. `void`-метод не может вернуть значение. Код после `return` недостижим. Бесконечный цикл без break никогда не завершается «нормально», поэтому `n` компилируется без return.',
    },
    {
      type: 'choice',
      q: 'Какие пары методов могут **одновременно** находиться в одном классе? Отметьте все.',
      options: [
        '`int f(int a)` и `long f(int b)`',
        '`void f(int a)` и `void f(long a)`',
        '`void f(int a, double b)` и `void f(double a, int b)`',
        '`void f(int... a)` и `void f(int[] a)`',
        '`void f(int a, String b)` и `void f(String b, int a)`',
        '`void f(int a)` и `void f(int b)`',
      ],
      answer: ['`void f(int a)` и `void f(long a)`', '`void f(int a, double b)` и `void f(double a, int b)`', '`void f(int a, String b)` и `void f(String b, int a)`'],
      explain: 'Перегрузка требует разных списков типов параметров (по количеству, типам или порядку). Тип результата и имена параметров в сигнатуру не входят. `int...` компилируется в `int[]`, поэтому эти методы совпадают. Заметьте: пара `f(int, double)` / `f(double, int)` объявляется, но вызов `f(1, 1)` будет неоднозначным.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nstatic void f(long x)    { System.out.print("long "); }\nstatic void f(Integer x) { System.out.print("Integer "); }\nstatic void f(int... x)  { System.out.print("varargs "); }\n\npublic static void main(String[] args) {\n    byte b = 1;\n    f(b);\n    f(5);\n    f(Integer.valueOf(5));\n    f();\n}\n```',
      answer: 'long long Integer varargs',
      explain: 'Порядок фаз: точное совпадение и расширение примитивов → упаковка → varargs. `byte` и `int` расширяются до `long` раньше, чем рассматривается упаковка в `Integer`. Для `Integer.valueOf(5)` есть точное совпадение. Без аргументов подходит только varargs.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nstatic void show(int x)    { System.out.print("int "); }\nstatic void show(double x) { System.out.print("double "); }\nstatic void show(Object x) { System.out.print("Object "); }\n\npublic static void main(String[] args) {\n    show(\'A\');\n    show(5L);\n    show("5");\n    show(5f);\n}\n```',
      answer: 'int double Object double',
      explain: '`char` расширяется до `int` (самый узкий подходящий). `long` в `int` не сужается, но расширяется до `double`. Строка подходит только к `Object`. `float` расширяется до `double`. Расширение примитива всегда выигрывает у упаковки в `Object`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nstatic void p(Object o) { System.out.println("Object"); }\nstatic void p(String s) { System.out.println("String"); }\n\npublic static void main(String[] args) {\n    p(null);\n}\n```',
      options: ['Выведет `Object`', 'Выведет `String`', 'Ошибка компиляции: неоднозначный вызов', '`NullPointerException`'],
      answer: 'Выведет `String`',
      explain: '`null` подходит к обоим методам. Компилятор выбирает самый специфичный: `String` — частный случай `Object`, значит, `p(String)` «уже» и выигрывает.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nstatic void q(Integer i) { System.out.println("Integer"); }\nstatic void q(String s)  { System.out.println("String"); }\n\npublic static void main(String[] args) {\n    q(null);\n}\n```',
      options: ['Выведет `Integer`', 'Выведет `String`', 'Ошибка компиляции: неоднозначный вызов', '`NullPointerException`'],
      answer: 'Ошибка компиляции: неоднозначный вызов',
      explain: '`null` подходит и к `Integer`, и к `String`, но ни один из этих типов не является частным случаем другого. Компилятор не может выбрать: *reference to q is ambiguous*. Помогает явное приведение: `q((String) null)`.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли вызов?\n```java\nstatic void g(Long x) { System.out.println("Long"); }\n\npublic static void main(String[] args) {\n    g(5);\n}\n```',
      options: ['Да, выведет `Long`', 'Нет, ошибка компиляции', 'Скомпилируется, но при запуске будет `ClassCastException`'],
      answer: 'Нет, ошибка компиляции',
      explain: '`int` упаковывается только в `Integer`, а `Integer` и `Long` — разные несвязанные классы. Расширить `int` до `long` и потом упаковать в `Long` компилятор не умеет. Нужно `g(5L)`.',
    },
    {
      type: 'order',
      q: 'Расставьте фазы выбора перегруженного метода в порядке, в котором их проверяет компилятор',
      items: [
        'Точное совпадение типов',
        'Расширение примитивов (int → long → double)',
        'Автоупаковка и распаковка (int ↔ Integer)',
        'Переменное число аргументов (varargs)',
      ],
      join: ' → ',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\nstatic void change(int x, int[] arr) {\n    x = 100;\n    arr[0] = 100;\n}\n\npublic static void main(String[] args) {\n    int n = 1;\n    int[] a = {1, 2};\n    change(n, a);\n    System.out.println(n + " " + a[0]);\n}\n```',
      answer: '1 100',
      explain: 'В `x` скопировано число 1 — меняется только копия. В `arr` скопирован адрес массива, он указывает на тот же объект, поэтому изменение элемента видно снаружи.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nstatic void reset(int[] arr) {\n    arr = new int[]{0, 0};\n    arr[0] = 42;\n}\n\npublic static void main(String[] args) {\n    int[] a = {1, 2};\n    reset(a);\n    System.out.println(a[0]);\n}\n```',
      options: ['`1`', '`0`', '`42`', 'Ошибка компиляции'],
      answer: '`1`',
      explain: 'Параметр `arr` — копия ссылки. После `arr = new int[]{0, 0}` копия указывает на новый массив, и 42 записывается уже в него. Переменная `a` в main по-прежнему указывает на старый массив {1, 2}.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nstatic void swap(int a, int b) {\n    int t = a;\n    a = b;\n    b = t;\n}\n\npublic static void main(String[] args) {\n    int a = 1, b = 2;\n    swap(a, b);\n    System.out.println(a + " " + b);\n}\n```',
      options: ['`1 2`', '`2 1`', '`2 2`', 'Ошибка компиляции: имена параметров совпадают с переменными'],
      answer: '`1 2`',
      explain: 'Параметры `a` и `b` метода swap — отдельные переменные-копии, хоть и с теми же именами. Метод меняет местами копии, переменные в main не меняются. В Java нельзя написать работающий swap для двух int-переменных.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\nstatic void modify(String s, StringBuilder sb) {\n    s += "!";\n    sb.append("!");\n}\n\npublic static void main(String[] args) {\n    String s = "hi";\n    StringBuilder sb = new StringBuilder("hi");\n    modify(s, sb);\n    System.out.println(s + " " + sb);\n}\n```',
      answer: 'hi hi!',
      explain: '`s += "!"` создаёт новую строку и переназначает локальную копию ссылки — снаружи не видно (String неизменяем). `sb.append` изменяет сам объект StringBuilder, на который указывают обе ссылки.',
    },
    {
      type: 'flashcard',
      front: 'Как в Java передаются аргументы в метод: по значению или по ссылке?',
      back: '**Всегда по значению.** Для примитивов копируется само значение. Для объектов и массивов копируется значение ссылки (адрес): через копию можно изменить сам объект, но переназначение параметра на другой объект снаружи не видно.',
      write: true,
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nstatic int f(int n) {\n    if (n <= 1) return 1;\n    return n * f(n - 2);\n}\n\npublic static void main(String[] args) {\n    System.out.println(f(7));\n}\n```',
      answer: '105',
      explain: 'f(7) = 7 · f(5) = 7 · 5 · f(3) = 7 · 5 · 3 · f(1) = 7 · 5 · 3 · 1 = 105.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\nstatic void p(int n) {\n    if (n == 0) return;\n    System.out.print(n + " ");\n    p(n - 1);\n    System.out.print(n + " ");\n}\n\npublic static void main(String[] args) {\n    p(3);\n}\n```',
      answer: '3 2 1 1 2 3',
      explain: 'Первая печать выполняется по пути «вниз» (3, 2, 1), вторая — на обратном пути, когда вызовы завершаются в обратном порядке (1, 2, 3).',
    },
    {
      type: 'number',
      q: 'Сколько всего раз будет вызван метод `fib` (включая самый первый вызов) при вычислении `fib(5)`?\n```java\nstatic int fib(int n) {\n    if (n < 2) return n;\n    return fib(n - 1) + fib(n - 2);\n}\n```',
      answer: '15',
      hint: 'Пусть C(n) — число вызовов. C(0) = C(1) = 1, C(n) = 1 + C(n−1) + C(n−2).',
      explain: 'C(2) = 1 + 1 + 1 = 3, C(3) = 1 + 3 + 1 = 5, C(4) = 1 + 5 + 3 = 9, C(5) = 1 + 9 + 5 = 15. Число вызовов растёт экспоненциально: для fib(10) уже 177.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт при вызове `f(1)`?\n```java\nstatic int f(int n) {\n    return f(n + 1);\n}\n```',
      options: ['Ошибка компиляции: нет базового случая', '`StackOverflowError` во время выполнения', 'Программа будет работать вечно', 'Вернёт `Integer.MAX_VALUE` после переполнения'],
      answer: '`StackOverflowError` во время выполнения',
      explain: 'Компилятор не проверяет, завершится ли рекурсия. Каждый вызов занимает место в стеке, стек ограничен — после тысяч вложенных вызовов JVM бросает `StackOverflowError` (это `Error`, а не `Exception`).',
    },
    {
      type: 'gaps',
      q: 'Допишите рекурсивный факториал',
      code: true,
      text: 'static [*long|void|boolean] factorial(int n) {\n    if (n [<=|<] 1) {          // базовый случай\n        return [1|1L];\n    }\n    return n * [factorial](n - 1);\n}',
      explain: 'Метод возвращает число, причём большое: 13! уже не влезает в int, поэтому `long`. Условие `n <= 1` (подойдёт и `n < 1`) покрывает 0! = 1; с `n == 1` вызов factorial(0) ушёл бы в бесконечную рекурсию.',
    },
    {
      type: 'choice',
      q: 'Какие объявления методов **скомпилируются**? Отметьте все.',
      options: [
        '`static void a(int... x, String s) { }`',
        '`static void b(String s, int... x) { }`',
        '`static void c(int... x, int... y) { }`',
        '`static void d(String... s) { }`',
      ],
      answer: ['`static void b(String s, int... x) { }`', '`static void d(String... s) { }`'],
      explain: 'Varargs-параметр может быть только один и обязательно последним — иначе компилятор не поймёт, где заканчиваются его аргументы.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nstatic int count(int... nums) {\n    return nums.length;\n}\n\npublic static void main(String[] args) {\n    System.out.println(count() + count(1, 2) + count(new int[]{1, 2, 3}));\n}\n```',
      answer: '5',
      explain: 'Без аргументов varargs получает пустой массив (длина 0, а не null). `count(1, 2)` — массив из 2 элементов. Готовый массив передаётся как есть — 3. Итого 0 + 2 + 3 = 5.',
    },
    {
      type: 'choice',
      q: 'Какие фрагменты (внутри метода `main`) **скомпилируются**? Отметьте все.',
      options: [
        '`for (int i = 0; i < 3; i++) { } for (int i = 0; i < 3; i++) { }`',
        '`int x = 1; { int x = 2; }`',
        '`for (int i = 0; i < 3; i++) { } System.out.println(i);`',
        '`{ int y = 1; } { int y = 2; }`',
        '`int i = 0; for (int i = 0; i < 3; i++) { }`',
      ],
      answer: ['`for (int i = 0; i < 3; i++) { } for (int i = 0; i < 3; i++) { }`', '`{ int y = 1; } { int y = 2; }`'],
      explain: 'Переменная видна от объявления до конца своего блока. Последовательные блоки и циклы могут переиспользовать имя. А объявить во вложенном блоке (или в заголовке цикла) переменную с именем уже видимой локальной переменной нельзя. Переменная цикла за циклом не видна.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? Запишите через пробел.\n```java\npublic class Main {\n    static int x = 10;\n\n    static void f() {\n        int x = 20;\n        System.out.print(x + " " + Main.x + " ");\n    }\n\n    public static void main(String[] args) {\n        f();\n        x++;\n        System.out.print(x);\n    }\n}\n```',
      answer: '20 10 11',
      explain: 'Внутри `f` локальная `x` затеняет поле класса, а `Main.x` обращается к полю явно. В `main` локальной `x` нет, поэтому `x++` увеличивает поле: 11.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nstatic int t(int v) {\n    System.out.print(v);\n    return v;\n}\nstatic int add(int a, int b) {\n    return a + b;\n}\n\npublic static void main(String[] args) {\n    System.out.println(" = " + add(t(1), t(2)));\n}\n```',
      options: ['`12 = 3`', '` = 312`', '` = 3`', '`21 = 3`'],
      answer: '`12 = 3`',
      explain: 'Чтобы вызвать `println`, сначала нужно вычислить его аргумент. Для этого вызывается `add`, а для `add` — сначала его аргументы слева направо: `t(1)` печатает 1, `t(2)` печатает 2. Только потом `println` выводит " = 3".',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\npublic class Main {\n    void hello() {\n        System.out.println("Hello");\n    }\n\n    public static void main(String[] args) {\n        hello();\n    }\n}\n```',
      options: ['Выведет `Hello`', 'Ошибка компиляции', 'Ничего не выведет', '`NullPointerException`'],
      answer: 'Ошибка компиляции',
      explain: '`hello` объявлен без `static` — это метод объекта, его можно вызвать только у объекта: `new Main().hello()`. Из статического `main` вызвать его просто по имени нельзя: *non-static method hello() cannot be referenced from a static context*.',
    },
    {
      type: 'match',
      q: 'Соедините термин и определение',
      pairs: [
        ['Сигнатура метода', 'имя метода и список типов его параметров'],
        ['Перегрузка', 'несколько методов с одним именем и разными параметрами'],
        ['Базовый случай', 'условие, при котором рекурсия останавливается'],
        ['Varargs', 'параметр вида `int... nums`, принимающий любое число аргументов'],
        ['Аргумент', 'конкретное значение, переданное при вызове'],
        ['StackOverflowError', 'переполнение стека вызовов из-за слишком глубокой рекурсии'],
      ],
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите рекурсивный метод `static int gcd(int a, int b)` — наибольший общий делитель по алгоритму Евклида: НОД(a, 0) = a, НОД(a, b) = НОД(b, a % b). Например, `gcd(48, 18)` = 6.',
      starter: `public class Main {
    static int gcd(int a, int b) {
        // ваш код
    }

    public static void main(String[] args) {
        System.out.println(gcd(48, 18)); // 6
        System.out.println(gcd(7, 13));  // 1
    }
}`,
      solution: `public class Main {
    static int gcd(int a, int b) {
        if (b == 0) {
            return a;              // базовый случай
        }
        return gcd(b, a % b);      // шаг: числа уменьшаются
    }

    public static void main(String[] args) {
        System.out.println(gcd(48, 18)); // 6
        System.out.println(gcd(7, 13));  // 1
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите метод `static int max(int first, int... rest)`, который возвращает максимум из всех переданных чисел. Почему первый параметр вынесен отдельно? (Подсказка: что должен вернуть max без аргументов?)',
      starter: `public class Main {
    static int max(int first, int... rest) {
        // ваш код
    }

    public static void main(String[] args) {
        System.out.println(max(5));            // 5
        System.out.println(max(3, 9, -2, 7));  // 9
    }
}`,
      solution: `public class Main {
    static int max(int first, int... rest) {
        int result = first;
        for (int x : rest) {
            if (x > result) {
                result = x;
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(max(5));            // 5
        System.out.println(max(3, 9, -2, 7));  // 9
    }
}`,
      explain: 'Отдельный параметр `first` гарантирует, что передано хотя бы одно число: вызов `max()` просто не скомпилируется. Иначе пришлось бы решать, что возвращать для пустого набора.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите рекурсивный метод `static int sumDigits(int n)` — сумма цифр неотрицательного числа без циклов. `sumDigits(4096)` = 19, `sumDigits(0)` = 0.',
      starter: `public class Main {
    static int sumDigits(int n) {
        // ваш код
    }

    public static void main(String[] args) {
        System.out.println(sumDigits(4096)); // 19
        System.out.println(sumDigits(0));    // 0
    }
}`,
      solution: `public class Main {
    static int sumDigits(int n) {
        if (n < 10) {
            return n;                          // одна цифра
        }
        return n % 10 + sumDigits(n / 10);     // последняя цифра + сумма остальных
    }

    public static void main(String[] args) {
        System.out.println(sumDigits(4096)); // 19
        System.out.println(sumDigits(0));    // 0
    }
}`,
      hint: 'Базовый случай — однозначное число. Шаг: последняя цифра `n % 10` плюс сумма цифр числа `n / 10`.',
    },
  ],
});
