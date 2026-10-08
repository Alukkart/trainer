Trainer.add({
  id: 'java-16-final-test',
  title: 'Java 16. Итоговая контрольная по ООП',
  subject: 'Java',
  description: 'Шпаргалка по всему курсу и 35 смешанных заданий по темам 1–15 с упором на ООП: полиморфизм, конструкторы, static, equals/hashCode, исключения. Удобно проходить в режиме «Контрольная».',
  lesson: `
## Как пользоваться

Это итоговый урок: ниже — сжатая шпаргалка по всему курсу, а в заданиях — смесь всех тем с упором на ООП. Пройдите задания в режиме **«Контрольная»** (без подсказок и с оценкой в конце), а потом — **«Работу над ошибками»**. Если тема «плывёт», вернитесь к соответствующему уроку: номер указан в скобках.

## Четыре принципа ООП (5–10, 15)

| Принцип | Суть | Как в Java |
|---|---|---|
| Инкапсуляция | состояние скрыто, доступ только через методы, которые защищают инварианты | \`private\` поля, геттеры, валидация, immutable-классы |
| Наследование | новый класс на основе существующего, отношение is-a | \`extends\` (один класс), \`implements\` (много интерфейсов) |
| Полиморфизм | один интерфейс — много реализаций, метод выбирается по реальному типу объекта | переопределение, позднее связывание |
| Абстракция | выделяем существенное, скрываем детали реализации | \`abstract\` классы, интерфейсы |

## Модификаторы доступа (6)

| Модификатор | Тот же класс | Тот же пакет | Наследник в другом пакете | Все остальные |
|---|---|---|---|---|
| \`private\` | ✅ | ❌ | ❌ | ❌ |
| *(нет, package-private)* | ✅ | ✅ | ❌ | ❌ |
| \`protected\` | ✅ | ✅ | ✅ | ❌ |
| \`public\` | ✅ | ✅ | ✅ | ✅ |

Класс верхнего уровня может быть только \`public\` или package-private. В одном файле — не больше одного \`public\` класса, и его имя совпадает с именем файла.

## Перегрузка и переопределение (4, 8, 9)

| | Перегрузка (overloading) | Переопределение (overriding) |
|---|---|---|
| Где | в одном классе (или в наследнике) | только в наследнике |
| Сигнатура | имя то же, **параметры разные** | имя и параметры **те же** |
| Тип возврата | любой | тот же или подтип (ковариантный) |
| Доступ | любой | не уже, чем у родителя |
| checked-исключения | любые | те же, уже или никаких |
| Когда выбирается | **при компиляции**, по объявленным типам аргументов | **при выполнении**, по реальному типу объекта |
| \`static\` / \`private\` / \`final\` | можно перегружать | не переопределяются |

Порядок выбора перегрузки: точное совпадение → расширение примитива (\`int\` → \`long\`) → автоупаковка (\`int\` → \`Integer\`) → varargs.

## Что полиморфно, а что нет (9)

| Элемент | По какому типу выбирается при \`Parent p = new Child()\` |
|---|---|
| Обычный метод экземпляра | по **реальному** типу объекта (\`Child\`) |
| Поле | по **объявленному** типу ссылки (\`Parent\`) — поля не полиморфны |
| \`static\` метод | по объявленному типу — он скрывается, а не переопределяется |
| \`private\` метод | не наследуется, вызывается версия того класса, где написан вызов |
| Перегрузка | по объявленным типам аргументов, при компиляции |

> ⚠️ Подвох: переопределяемый метод, вызванный из конструктора родителя, выполнится в версии потомка **до** инициализации полей потомка — увидит \`0\`, \`false\` или \`null\`.

## Конструкторы и порядок инициализации (5, 7, 8)

- Если в классе нет ни одного конструктора, компилятор добавляет конструктор по умолчанию без параметров. Объявили хотя бы один — он **исчезает**.
- Первая строка конструктора — \`this(...)\` или \`super(...)\`. Если ничего не написано, неявно вставляется \`super()\`; если у родителя нет конструктора без параметров — **ошибка компиляции**.
- Конструкторы **не наследуются**.

Порядок при первом \`new Child()\`:

1. static-поля и static-блоки **родителя** (один раз, при загрузке класса);
2. static-поля и static-блоки **потомка** (один раз);
3. поля и блоки инициализации экземпляра **родителя**, затем тело конструктора **родителя**;
4. поля и блоки инициализации экземпляра **потомка**, затем тело конструктора **потомка**.

При втором \`new Child()\` пункты 1–2 уже не выполняются.

## static и final (7)

| | \`static\` | \`final\` |
|---|---|---|
| Поле | одно на класс, общее для всех объектов | присвоить можно только один раз |
| Метод | вызывается без объекта, нет \`this\`, не видит нестатические члены | нельзя переопределить |
| Класс | (только вложенный) не связан с внешним объектом | нельзя наследовать |
| Переменная | — | нельзя переприсвоить; объект по \`final\`-ссылке менять **можно** |

Статический метод можно вызвать через ссылку — даже равную \`null\`: компилятор подставит имя класса, и NPE не будет.

## Абстрактный класс и интерфейс (10)

| | Абстрактный класс | Интерфейс |
|---|---|---|
| Создать объект | нельзя | нельзя |
| Наследование | один \`extends\` | много \`implements\` |
| Состояние | любые поля | только константы \`public static final\` |
| Конструктор | есть | нет |
| Методы | любые, с любым доступом | \`public abstract\` по умолчанию, плюс \`default\`, \`static\`, \`private\` |
| Когда выбирать | общий код и состояние близких классов (is-a) | контракт-способность («умеет»), разные иерархии |

Два интерфейса с одинаковым \`default\`-методом → класс **обязан** его переопределить, а выбрать версию можно через \`A.super.method()\`.

## equals, hashCode и сравнение (3, 11, 14)

- \`==\` для объектов сравнивает **ссылки**, \`equals\` — содержимое (если переопределён).
- Строковые литералы и константы времени компиляции (\`"Ja" + "va"\`) берутся из пула; \`new String(...)\` — всегда новый объект.
- Кэш \`Integer\`: −128..127; обёртки сравнивайте через \`equals\`.
- Сигнатура строго \`public boolean equals(Object o)\` — метод \`equals(Point p)\` это **перегрузка**, коллекции её не вызовут.
- Контракт: рефлексивность, симметричность, транзитивность, согласованность, \`x.equals(null) == false\`.
- Равные по \`equals\` объекты **обязаны** иметь равные \`hashCode\`. Переопределили \`equals\` без \`hashCode\` — \`HashSet\` и \`HashMap\` работают неправильно.
- \`record\` генерирует \`equals\`, \`hashCode\` и \`toString\` по всем компонентам.

## Исключения (13)

| | Checked | Unchecked |
|---|---|---|
| Классы | \`Exception\` и потомки, кроме \`RuntimeException\` | \`RuntimeException\`, \`Error\` и потомки |
| Компилятор | требует поймать или объявить \`throws\` | не требует |
| Примеры | \`IOException\`, \`InterruptedException\` | \`NullPointerException\`, \`IllegalArgumentException\` |

\`catch\` — от частного к общему. \`finally\` выполняется всегда; \`return\` в \`finally\` перебивает всё. Если в \`try\`/\`catch\` выполнен \`return\` выражения, то его значение вычислено **до** \`finally\`. try-with-resources закрывает ресурсы в обратном порядке до \`catch\`.

## Коллекции и generics (14)

\`List\` — порядок и индексы (\`ArrayList\`), \`Set\` — уникальность (\`HashSet\`, \`LinkedHashSet\`, \`TreeSet\`), \`Map\` — ключ → значение (\`HashMap\`, \`TreeMap\`). \`List<Integer>\` — не подтип \`List<Number>\`; PECS: читаем — \`? extends\`, пишем — \`? super\`. \`list.remove(1)\` удаляет по индексу. Удалять при обходе — через \`Iterator.remove()\` или \`removeIf\`. \`List.of\` — неизменяемый.

## Проектирование (15)

SOLID: **S** — одна причина для изменения; **O** — расширяем без изменения (полиморфизм вместо \`instanceof\`-цепочек); **L** — подтип заменяет базовый тип (квадрат и прямоугольник); **I** — маленькие интерфейсы; **D** — зависимость от абстракций, внедрение через конструктор. Предпочитайте композицию наследованию. Паттерны: Singleton, Factory Method, Strategy, Observer. DRY, KISS, YAGNI.

## Топ подвохов перед контрольной

1. \`7 / 2\` — это \`3\`; \`1 + 2 + "3"\` — это \`"33"\`; \`(byte) 200\` — это \`-56\`.
2. \`switch\` без \`break\` проваливается в следующие \`case\`.
3. Java передаёт параметры **только по значению**: объект изменить можно, переназначить ссылку вызывающего — нет.
4. Поля и \`static\`-методы не полиморфны, \`private\`-методы не переопределяются.
5. Перегрузка выбирается по объявленному типу, переопределение — по реальному.
6. Лямбда и анонимный класс захватывают только effectively final переменные.
7. \`equals\` без \`hashCode\` ломает хеш-коллекции; \`equals(Point)\` вместо \`equals(Object)\` — это перегрузка.
8. Нельзя ловить checked-исключение, которое не может возникнуть, и нельзя ставить общий \`catch\` раньше частного.
`,
  tasks: [
    {
      type: 'input',
      q: 'Что выведет код? Запишите две строки вывода через пробел.\n```java\nSystem.out.println(1 + 2 + "3" + 4 + 5);\nbyte b = (byte) 200;\nSystem.out.println(b);\n```',
      answer: ['3345 -56'],
      explain: 'Сложение идёт слева направо: `1 + 2 = 3`, дальше со строкой — конкатенация: `"33"`, `"334"`, `"3345"`. `200` не помещается в `byte` (−128..127): `200 − 256 = −56`.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nint day = 2;\nswitch (day) {\n    case 1: System.out.print("A");\n    case 2: System.out.print("B");\n    case 3: System.out.print("C"); break;\n    case 4: System.out.print("D");\n}\n```',
      answer: ['BC'],
      explain: 'Выполнение начинается с `case 2` и «проваливается» дальше, пока не встретит `break` после `C`. В стрелочном `switch` (`case 2 ->`) проваливания нет.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nString a = "Java";\nString b = "Ja" + "va";\nString c = new String("Java");\nString d = c.intern();\nSystem.out.println((a == b) + " " + (a == c) + " " + a.equals(c) + " " + (a == d));\n```',
      answer: ['true false true true'],
      explain: '`"Ja" + "va"` — константа времени компиляции, она склеивается заранее и берётся из пула строк, поэтому `a == b`. `new String` всегда создаёт новый объект. `equals` сравнивает символы. `intern()` возвращает строку из пула — тот же объект, что `a`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    static void change(int[] arr, int x, StringBuilder sb, String s) {\n        arr[0] = 99;\n        x = 99;\n        sb.append("!");\n        s = s + "!";\n        arr = new int[]{-1};\n    }\n\n    public static void main(String[] args) {\n        int[] arr = {1};\n        int x = 1;\n        StringBuilder sb = new StringBuilder("hi");\n        String s = "hi";\n        change(arr, x, sb, s);\n        System.out.println(arr[0] + " " + x + " " + sb + " " + s);\n    }\n}\n```',
      answer: ['99 1 hi! hi'],
      explain: 'Java передаёт всё по значению; для объектов копируется **ссылка**. Через копию ссылки можно изменить сам объект (`arr[0]`, `sb.append`), но присваивание параметру (`x = 99`, `s = ...`, `arr = new int[]`) меняет только локальную копию. `String` к тому же неизменяем.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    static void m(long x) { System.out.print("long "); }\n    static void m(Integer x) { System.out.print("Integer "); }\n    static void m(Object x) { System.out.print("Object "); }\n    static void m(int... x) { System.out.print("varargs "); }\n\n    public static void main(String[] args) {\n        m(5);\n        m(Integer.valueOf(5));\n        m("5");\n        m();\n    }\n}\n```',
      answer: ['long Integer Object varargs'],
      explain: 'Для `m(5)` точного `m(int)` нет; расширение `int → long` имеет приоритет над автоупаковкой в `Integer`. `Integer` подходит точно. `String` подходит только к `Object`. Вызов без аргументов возможен только с varargs.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nclass Point {\n    int x, y;\n\n    Point(int x, int y) {\n        this.x = x;\n        this.y = y;\n    }\n}\n\n// в main:\nPoint p = new Point();\n```',
      options: [
        'Ошибка компиляции: конструктора без параметров нет',
        'Создастся точка (0, 0)',
        'Создастся точка с `x` и `y`, равными `null`',
        'Ошибка во время выполнения: `NullPointerException`',
      ],
      answer: 'Ошибка компиляции: конструктора без параметров нет',
      explain: 'Конструктор по умолчанию добавляется только если в классе **нет ни одного** конструктора. Здесь объявлен `Point(int, int)`, поэтому `new Point()` не компилируется.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass Ticket {\n    static int count = 0;\n    final int number;\n\n    Ticket() {\n        count++;\n        number = count;\n    }\n}\n\nTicket a = new Ticket();\nTicket b = new Ticket();\nTicket c = new Ticket();\nSystem.out.println(a.number + " " + c.number + " " + Ticket.count + " " + a.count);\n```',
      answer: ['1 3 3 3'],
      explain: '`count` — статическое поле, одно на весь класс, поэтому и `Ticket.count`, и `a.count` дают 3. `number` — поле экземпляра: у каждого билета свой номер, зафиксированный в момент создания.',
    },
    {
      type: 'match',
      q: 'Соедините модификатор доступа и область видимости члена класса',
      pairs: [
        ['`private`', 'только внутри своего класса'],
        ['без модификатора', 'свой класс и все классы того же пакета'],
        ['`protected`', 'свой пакет и наследники в других пакетах'],
        ['`public`', 'отовсюду'],
      ],
    },
    {
      type: 'choice',
      q: 'Что нужно, чтобы класс `Passport` с полем `List<String> visas` был **неизменяемым**? (Выберите все верные)',
      options: [
        'Объявить класс `final` (или сделать конструктор закрытым)',
        'Сделать все поля `private final`',
        'Не писать сеттеров и методов, меняющих состояние',
        'В конструкторе и геттере делать защитные копии списка (`List.copyOf`)',
        'Объявить поле `visas` как `public final`, ведь `final` запрещает изменения',
        'Сделать все методы `static`',
      ],
      answer: [
        'Объявить класс `final` (или сделать конструктор закрытым)',
        'Сделать все поля `private final`',
        'Не писать сеттеров и методов, меняющих состояние',
        'В конструкторе и геттере делать защитные копии списка (`List.copyOf`)',
      ],
      explain: '`final` у ссылки запрещает её переприсвоить, но не менять сам список: через `public final List` любой сможет вызвать `visas.add(...)`. Защитные копии нужны, чтобы внешний код не держал ссылку на внутренний изменяемый объект. `final`-класс не даст наследнику добавить изменяемость.',
    },
    {
      type: 'order',
      q: 'Расставьте строки вывода `new Child();` в правильном порядке\n```java\nclass Parent {\n    static { System.out.println("static Parent"); }\n    { System.out.println("init Parent"); }\n    Parent() { System.out.println("ctor Parent"); }\n}\n\nclass Child extends Parent {\n    static { System.out.println("static Child"); }\n    { System.out.println("init Child"); }\n    Child() { System.out.println("ctor Child"); }\n}\n```',
      items: ['static Parent', 'static Child', 'init Parent', 'ctor Parent', 'init Child', 'ctor Child'],
      join: '\n',
      explain: 'Сначала загружаются классы — от предка к потомку, выполняются static-блоки. Затем создаётся объект: сначала полностью инициализируется часть родителя (блоки экземпляра, потом тело конструктора), затем — часть потомка.',
    },
    {
      type: 'number',
      q: 'Классы `Parent` и `Child` из предыдущего задания: каждый блок и конструктор печатает одну строку. Сколько строк всего выведет код `new Child(); new Child();`?',
      answer: '10',
      explain: 'Первое создание — 6 строк (2 static + 4 для объекта). Статические блоки выполняются только один раз, при загрузке класса, поэтому второе создание даёт ещё 4 строки. Итого 10.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nclass Util {\n    static String hello() { return "hello"; }\n}\n\n// в main:\nUtil u = null;\nSystem.out.println(u.hello());\n```',
      options: [
        'Выведет `hello`',
        '`NullPointerException`',
        'Ошибка компиляции: статический метод нельзя вызывать через ссылку',
        'Выведет `null`',
      ],
      answer: 'Выведет `hello`',
      explain: 'Статический метод принадлежит классу. Компилятор смотрит только на **объявленный тип** ссылки и превращает вызов в `Util.hello()`; значение `u` не используется. Так писать не стоит (будет предупреждение), но работает.',
    },
    {
      type: 'choice',
      q: 'Какая строка **не скомпилируется**?\n```java\nfinal List<String> list = new ArrayList<>();\nlist.add("a");                 // 1\nlist.set(0, "b");              // 2\nlist.clear();                  // 3\nlist = new ArrayList<>();      // 4\n```',
      options: ['4', '1', '2', '3', 'Все строки компилируются'],
      answer: '4',
      explain: '`final` относится к **переменной**-ссылке: её нельзя переприсвоить («cannot assign a value to final variable list»). Сам объект `ArrayList` остаётся изменяемым.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт при компиляции?\n```java\nclass Animal {\n    Animal(String name) { }\n}\n\nclass Dog extends Animal {\n    Dog() {\n        System.out.println("Dog");\n    }\n}\n```',
      options: [
        'Ошибка компиляции: неявный `super()` не находит `Animal()` без параметров',
        'Компилируется; `name` у `Animal` будет `null`',
        'Компилируется, но `new Dog()` бросит исключение',
        'Ошибка компиляции: конструкторы `Dog` и `Animal` должны иметь одинаковые параметры',
      ],
      answer: 'Ошибка компиляции: неявный `super()` не находит `Animal()` без параметров',
      explain: 'Если конструктор не начинается с `this(...)` или `super(...)`, компилятор вставляет `super()`. У `Animal` есть только конструктор со строкой. Исправление: `Dog() { super("Шарик"); ... }`.',
    },
    {
      type: 'choice',
      q: 'В родителе есть метод `protected Number calc() throws IOException`. Какие переопределения в наследнике **скомпилируются**?',
      options: [
        '`public Integer calc()`',
        '`protected Integer calc() throws FileNotFoundException`',
        '`Number calc()` (без модификатора)',
        '`protected Object calc()`',
        '`public Number calc() throws Exception`',
      ],
      answer: ['`public Integer calc()`', '`protected Integer calc() throws FileNotFoundException`'],
      explain: 'Можно: расширить доступ (`protected` → `public`), сузить тип возврата (ковариантность: `Integer` — подтип `Number`), сузить или убрать checked-исключения. Нельзя: сузить доступ до package-private, расширить тип возврата до `Object`, расширить исключение до `Exception`.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass Animal {\n    String name = "животное";\n\n    String sound() { return "..."; }\n\n    String describe() { return name + ": " + sound(); }\n}\n\nclass Cat extends Animal {\n    String name = "кот";\n\n    @Override\n    String sound() { return "мяу"; }\n}\n\nAnimal a = new Cat();\nSystem.out.println(a.name + " | " + a.sound() + " | " + a.describe());\n```',
      answer: ['животное | мяу | животное: мяу'],
      explain: 'Поля не полиморфны: `a.name` берётся по объявленному типу `Animal`, а внутри `describe()` (метод класса `Animal`) `name` — тоже поле `Animal`. Поле `name` в `Cat` лишь **затеняет** родительское. Метод `sound()` полиморфен и вызывается по реальному типу — `Cat`.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass Printer {\n    void print(Object o) { System.out.print("P-Object "); }\n    void print(String s) { System.out.print("P-String "); }\n}\n\nclass FancyPrinter extends Printer {\n    @Override\n    void print(Object o) { System.out.print("F-Object "); }\n}\n\nPrinter p = new FancyPrinter();\nObject o = "текст";\np.print(o);\np.print("текст");\n```',
      answer: ['F-Object P-String'],
      hint: 'Сначала компилятор выбирает перегрузку по объявленным типам, потом JVM выбирает переопределение по реальному типу объекта.',
      explain: '`p.print(o)`: объявленный тип аргумента — `Object`, поэтому при компиляции выбран `print(Object)`; во время выполнения объект — `FancyPrinter`, вызывается его версия. `p.print("текст")`: выбран `print(String)`, а его `FancyPrinter` не переопределял — работает версия `Printer`.',
    },
    {
      type: 'choice',
      q: 'Что выведет `new Derived();`?\n```java\nclass Base {\n    Base() {\n        init();\n    }\n\n    void init() { System.out.println("Base.init"); }\n}\n\nclass Derived extends Base {\n    private String label = "готово";\n\n    @Override\n    void init() { System.out.println("Derived.init: " + label); }\n}\n```',
      options: [
        '`Derived.init: null`',
        '`Derived.init: готово`',
        '`Base.init`',
        '`Base.init`, затем `Derived.init: готово`',
      ],
      answer: '`Derived.init: null`',
      explain: 'Конструктор `Base` выполняется **до** инициализации полей `Derived`. Вызов `init()` полиморфен — работает версия `Derived`, но поле `label` ещё имеет значение по умолчанию `null`. Поэтому из конструктора не стоит вызывать переопределяемые методы.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nclass A {\n    static String who() { return "A"; }\n    String me() { return "A"; }\n}\n\nclass B extends A {\n    static String who() { return "B"; }\n    @Override\n    String me() { return "B"; }\n}\n\nA x = new B();\nSystem.out.println(x.who() + x.me());\n```',
      options: ['`AB`', '`BB`', '`AA`', '`BA`'],
      answer: '`AB`',
      explain: 'Статические методы не переопределяются, а **скрываются**: `x.who()` выбирается по объявленному типу `A`. `me()` — обычный метод экземпляра, вызывается по реальному типу `B`.',
    },
    {
      type: 'choice',
      q: '`Dog` и `Cat` — наследники `Animal`. Какие утверждения о коде **верны**?\n```java\nAnimal a = new Dog();\nCat c = (Cat) a;          // строка 1\nString s = (String) a;    // строка 2\n```',
      options: [
        'Строка 2 не компилируется: `Animal` и `String` не связаны наследованием',
        'Строка 1 компилируется, но при выполнении бросит `ClassCastException`',
        'Строка 1 не компилируется: `Dog` нельзя привести к `Cat`',
        'Строка 1 выполнится, и `c` будет `null`',
      ],
      answer: [
        'Строка 2 не компилируется: `Animal` и `String` не связаны наследованием',
        'Строка 1 компилируется, но при выполнении бросит `ClassCastException`',
      ],
      explain: 'Компилятор знает только объявленный тип `Animal`: за ним может скрываться `Cat`, поэтому нисходящее приведение разрешено, а проверка откладывается до выполнения. `String` никак не связан с `Animal` — такое приведение невозможно ни при каком объекте. Безопасный вариант: `if (a instanceof Cat cat) { ... }`.',
    },
    {
      type: 'input',
      q: 'Что выведет `new Child().call();`?\n```java\nclass Parent {\n    private void hello() { System.out.println("Parent"); }\n\n    void call() { hello(); }\n}\n\nclass Child extends Parent {\n    void hello() { System.out.println("Child"); }\n}\n```',
      answer: ['Parent'],
      explain: '`private`-методы не наследуются и не переопределяются. `hello()` в `Child` — совершенно отдельный метод. Вызов внутри `Parent.call()` привязан к приватному `Parent.hello()` ещё при компиляции.',
    },
    {
      type: 'choice',
      q: 'Какие утверждения **верны**?',
      options: [
        'У абстрактного класса может быть конструктор',
        'Абстрактный класс может не содержать ни одного абстрактного метода',
        'Поля интерфейса неявно `public static final`',
        'Класс может реализовать несколько интерфейсов, но наследовать только один класс',
        'Объект абстрактного класса можно создать, если у него есть конструктор',
        'Методы интерфейса без тела неявно `protected abstract`',
      ],
      answer: [
        'У абстрактного класса может быть конструктор',
        'Абстрактный класс может не содержать ни одного абстрактного метода',
        'Поля интерфейса неявно `public static final`',
        'Класс может реализовать несколько интерфейсов, но наследовать только один класс',
      ],
      explain: 'Конструктор абстрактного класса вызывают наследники через `super(...)`, но `new` для абстрактного класса невозможен. Методы интерфейса без тела неявно `public abstract`, а не `protected`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\ninterface A { default String hi() { return "A"; } }\ninterface B { default String hi() { return "B"; } }\nclass C implements A, B { }\n```',
      options: [
        'Ошибка компиляции; нужно переопределить `hi()` в `C`, например через `A.super.hi()`',
        'Компилируется, `new C().hi()` вернёт `"A"` — первый интерфейс в списке',
        'Компилируется, `new C().hi()` вернёт `"B"` — последний интерфейс в списке',
        'Ошибка компиляции: интерфейсы не могут содержать методы с телом',
      ],
      answer: 'Ошибка компиляции; нужно переопределить `hi()` в `C`, например через `A.super.hi()`',
      explain: 'При конфликте двух `default`-методов компилятор не выбирает сам («types A and B are incompatible»). Класс обязан переопределить метод и может явно вызвать нужную версию: `A.super.hi()` или `B.super.hi()`.',
    },
    {
      type: 'input',
      q: 'Что выведет код? (Считайте, что хеш-коды разных объектов различаются.)\n```java\nclass Book {\n    String isbn;\n\n    Book(String isbn) { this.isbn = isbn; }\n\n    @Override\n    public boolean equals(Object o) {\n        return o instanceof Book b && isbn.equals(b.isbn);\n    }\n}\n\nSet<Book> set = new HashSet<>();\nset.add(new Book("123"));\nset.add(new Book("123"));\nList<Book> list = new ArrayList<>();\nlist.add(new Book("123"));\nSystem.out.println(set.size() + " " + list.contains(new Book("123")));\n```',
      answer: ['2 true'],
      explain: '`equals` переопределён, а `hashCode` — нет: у двух «равных» книг разные хеш-коды из `Object`, и `HashSet` даже не доходит до вызова `equals`. `ArrayList.contains` хеши не использует, только `equals`, — поэтому `true`. Нарушен контракт: равные объекты обязаны иметь равные `hashCode`.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass Point {\n    int x, y;\n\n    Point(int x, int y) {\n        this.x = x;\n        this.y = y;\n    }\n\n    public boolean equals(Point p) {\n        return x == p.x && y == p.y;\n    }\n}\n\nPoint a = new Point(1, 2);\nPoint b = new Point(1, 2);\nObject o = b;\nSystem.out.println(a.equals(b) + " " + a.equals(o) + " " + List.of(a).contains(b));\n```',
      answer: ['true false false'],
      explain: '`equals(Point)` — это **перегрузка**, а не переопределение `equals(Object)`. `a.equals(b)` при компиляции выбирает `equals(Point)`. Для аргумента типа `Object` выбирается унаследованный `Object.equals` (сравнение ссылок). Коллекции тоже вызывают `equals(Object)`. Аннотация `@Override` сразу выдала бы ошибку компиляции.',
    },
    {
      type: 'input',
      q: 'Что выведет код? Запишите имена через пробел.\n```java\nrecord Student(String name, int grade) { }\n\nList<Student> list = new ArrayList<>(List.of(\n        new Student("Оля", 5), new Student("Иван", 4), new Student("Анна", 5)));\nlist.sort(Comparator.comparing(Student::grade).reversed().thenComparing(Student::name));\nfor (Student s : list) {\n    System.out.print(s.name() + " ");\n}\n```',
      answer: ['Анна Оля Иван'],
      explain: 'Сначала по оценке по убыванию (`reversed()` относится к уже построенному компаратору по `grade`), при равной оценке — по имени по алфавиту: среди пятёрок `Анна` раньше `Оля`. У `record` геттеры называются как компоненты: `name()`, `grade()`.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nint count = 0;\nRunnable r = () -> System.out.println(count);\ncount++;\n```',
      options: [
        'Нет: лямбда может захватывать только final или effectively final переменные',
        'Да, при вызове `r.run()` выведет `1`',
        'Да, при вызове `r.run()` выведет `0`',
        'Нет: `Runnable` не может использоваться с лямбдой',
      ],
      answer: 'Нет: лямбда может захватывать только final или effectively final переменные',
      explain: 'Из-за `count++` переменная перестаёт быть effectively final. Лямбды и анонимные классы захватывают **значение** локальной переменной, поэтому Java требует, чтобы оно не менялось.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nenum Level { LOW, MEDIUM, HIGH }\n\nLevel l = Level.valueOf("MEDIUM");\nSystem.out.println(l.ordinal() + " " + l.name() + " " + Level.values().length + " " + (l.compareTo(Level.HIGH) < 0));\n```',
      answer: ['1 MEDIUM 3 true'],
      explain: '`ordinal()` — порядковый номер с нуля, `name()` — имя константы, `values()` — массив всех констант. Константы enum сравниваются по порядку объявления: `MEDIUM` раньше `HIGH`.',
    },
    {
      type: 'input',
      q: 'Что выведет `System.out.println(test());`?\n```java\nstatic String test() {\n    StringBuilder log = new StringBuilder();\n    try {\n        log.append("T");\n        throw new IllegalStateException();\n    } catch (RuntimeException e) {\n        log.append("C");\n        return log.toString();\n    } finally {\n        log.append("F");\n    }\n}\n```',
      answer: ['TC'],
      explain: 'Выражение `log.toString()` вычисляется в момент `return` — получается новая строка `"TC"`. `finally` дописывает `F` в `StringBuilder`, но возвращаемая строка уже создана и неизменяема. (Если бы возвращался сам `log`, результат был бы `TCF`.)',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nclass AppException extends Exception {\n    AppException(String message) { super(message); }\n}\n\npublic class Main {\n    static void run() {\n        throw new AppException("Ошибка");\n    }\n    public static void main(String[] args) { run(); }\n}\n```',
      options: [
        'Ошибка компиляции: checked-исключение нужно поймать или объявить в `throws`',
        'Компилируется, программа завершится с `AppException: Ошибка`',
        'Компилируется, исключение будет проигнорировано',
        'Ошибка компиляции: свои исключения должны наследоваться от `RuntimeException`',
      ],
      answer: 'Ошибка компиляции: checked-исключение нужно поймать или объявить в `throws`',
      explain: '`AppException extends Exception` — проверяемое исключение. Нужно `static void run() throws AppException` (и тогда `main` тоже должен поймать или объявить его), либо наследоваться от `RuntimeException`, если исключение должно быть непроверяемым.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nList<Integer> nums = new ArrayList<>(List.of(100, 200, 300));\nInteger a = 200, b = 200;\nnums.remove(Integer.valueOf(100));\nSystem.out.println(nums + " " + (a == b) + " " + a.equals(b));\n```',
      answer: ['[200, 300] false true'],
      explain: '`remove(Integer.valueOf(100))` удаляет **значение** 100 (а `remove(100)` пытался бы удалить индекс 100 и упал бы). `200` вне кэша `Integer` (−128..127), поэтому `a` и `b` — разные объекты: `==` даёт `false`, `equals` — `true`.',
    },
    {
      type: 'match',
      q: 'Соедините проблему в коде и принцип, который поможет её исправить',
      pairs: [
        ['Класс `User` и хранит данные, и рисует HTML, и пишет в базу', 'SRP'],
        ['Для каждого нового типа скидки дописывается `else if` в `Checkout`', 'OCP'],
        ['`Penguin extends Bird`, а `fly()` бросает `UnsupportedOperationException`', 'LSP'],
        ['Интерфейс `Animal` требует от рыбы реализовать `walk()` и `fly()`', 'ISP'],
        ['Сервис внутри себя делает `new SmtpMailer()`, и его не протестировать', 'DIP'],
      ],
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Спроектируйте иерархию сотрудников.\n- Абстрактный класс `Employee`: `private final` поля `name` и `baseSalary` с проверкой в конструкторе (имя не пустое, оклад не отрицательный), геттеры, абстрактный метод `double salary()` и `toString()` вида `Manager Ольга: 120000.0`.\n- `Manager` — оклад плюс премия в процентах; `Developer` — оклад плюс 1000 за каждый час переработки; `Intern` — фиксированные 30000.\n- Статический метод `totalPayroll(...)`, принимающий список любых сотрудников.\n\nВ `main` создайте по одному сотруднику каждого типа, отсортируйте по зарплате по убыванию, выведите и посчитайте итог.',
      starter: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

abstract class Employee {
    // ваш код
}

// Manager, Developer, Intern

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

abstract class Employee {
    private final String name;
    private final double baseSalary;

    protected Employee(String name, double baseSalary) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Имя не указано");
        }
        if (baseSalary < 0) {
            throw new IllegalArgumentException("Оклад не может быть отрицательным");
        }
        this.name = name;
        this.baseSalary = baseSalary;
    }

    public String getName() { return name; }
    public double getBaseSalary() { return baseSalary; }

    public abstract double salary();          // каждый тип считает по-своему

    @Override
    public String toString() {
        return getClass().getSimpleName() + " " + name + ": " + salary();
    }
}

class Manager extends Employee {
    private final double bonusPercent;

    Manager(String name, double baseSalary, double bonusPercent) {
        super(name, baseSalary);
        this.bonusPercent = bonusPercent;
    }

    @Override
    public double salary() {
        return getBaseSalary() * (1 + bonusPercent / 100);
    }
}

class Developer extends Employee {
    private final int overtimeHours;
    private static final double HOUR_RATE = 1000;

    Developer(String name, double baseSalary, int overtimeHours) {
        super(name, baseSalary);
        this.overtimeHours = overtimeHours;
    }

    @Override
    public double salary() {
        return getBaseSalary() + overtimeHours * HOUR_RATE;
    }
}

class Intern extends Employee {
    Intern(String name) {
        super(name, 30000);
    }

    @Override
    public double salary() {
        return getBaseSalary();
    }
}

public class Main {
    static double totalPayroll(List<? extends Employee> staff) {
        double total = 0;
        for (Employee e : staff) {
            total += e.salary();                 // полиморфный вызов
        }
        return total;
    }

    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>();
        staff.add(new Manager("Ольга", 100000, 20));
        staff.add(new Developer("Иван", 90000, 10));
        staff.add(new Intern("Пётр"));

        staff.sort(Comparator.comparingDouble(Employee::salary).reversed());
        for (Employee e : staff) {
            System.out.println(e);
        }
        System.out.println("Итого: " + totalPayroll(staff));
    }
}
// выведет:
// Manager Ольга: 120000.0
// Developer Иван: 100000.0
// Intern Пётр: 30000.0
// Итого: 250000.0`,
      explain: 'Здесь работают все четыре принципа: абстракция (`Employee` с абстрактным `salary()`), инкапсуляция (`private final` поля с проверкой), наследование (`super(...)` в конструкторах) и полиморфизм (`totalPayroll` и `toString` не знают конкретных типов). Новый тип сотрудника добавляется без изменения `totalPayroll` (OCP).',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите **неизменяемый** класс `Money` (сумма `long amount` и код валюты `currency`):\n- проверка в конструкторе: сумма не отрицательна, код валюты — ровно три символа (храните в верхнем регистре);\n- метод `Money add(Money other)` возвращает **новый** объект; при разных валютах — `IllegalArgumentException`;\n- корректные `equals`, `hashCode`, `toString` (`350 RUB`).\n\nВ `main` сложите 100 и 250 рублей (одну валюту передайте как `"rub"`), положите в `HashSet` два равных объекта и выведите размер, попробуйте сложить рубли с долларами.',
      starter: `import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

final class Money {
    // ваш код
}

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

final class Money {
    private final long amount;
    private final String currency;

    public Money(long amount, String currency) {
        if (amount < 0) {
            throw new IllegalArgumentException("Сумма не может быть отрицательной: " + amount);
        }
        if (currency == null || currency.length() != 3) {
            throw new IllegalArgumentException("Код валюты — три буквы: " + currency);
        }
        this.amount = amount;
        this.currency = currency.toUpperCase();
    }

    public long getAmount() { return amount; }
    public String getCurrency() { return currency; }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Нельзя сложить " + currency + " и " + other.currency);
        }
        return new Money(amount + other.amount, currency);   // новый объект, this не меняется
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount == money.amount && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }

    @Override
    public String toString() {
        return amount + " " + currency;
    }
}

public class Main {
    public static void main(String[] args) {
        Money a = new Money(100, "rub");
        Money b = new Money(250, "RUB");
        Money sum = a.add(b);
        System.out.println(a + " + " + b + " = " + sum);

        Set<Money> set = new HashSet<>();
        set.add(new Money(350, "RUB"));
        set.add(sum);
        System.out.println(set.size());               // 1 — equals и hashCode согласованы

        try {
            a.add(new Money(5, "USD"));
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}
// выведет:
// 100 RUB + 250 RUB = 350 RUB
// 1
// Нельзя сложить RUB и USD`,
      explain: 'Неизменяемость: `final` класс, `private final` поля, нет сеттеров, «изменяющие» операции возвращают новый объект. `equals` и `hashCode` используют одни и те же поля, поэтому два равных объекта в `HashSet` считаются одним. Такой класс можно было бы записать и как `record Money(long amount, String currency)` с компактным конструктором для проверок.',
    },
  ],
});
