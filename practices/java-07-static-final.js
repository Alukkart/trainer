// Java 7. static, final и инициализация. Теория — в поле lesson, задания — в tasks.
Trainer.add({
  id: 'java-07-static-final',
  title: 'Java 7. static, final и инициализация',
  subject: 'Java',
  description: 'Члены класса и экземпляра, статические методы и счётчики, final-переменные, поля и константы, блоки инициализации и точный порядок инициализации объекта.',
  lesson: `
## Члены класса и члены экземпляра

До сих пор каждое поле принадлежало конкретному объекту: у каждого студента своё имя, у каждого счёта свой баланс. Но бывают данные, общие для **всех** объектов класса: сколько студентов уже создано, процентная ставка банка, число π. Хранить копию в каждом объекте бессмысленно — нужна одна на весь класс.

> 💡 Аналогия: в общежитии у каждой комнаты свой номер и свои жильцы — это *поля экземпляра*. А доска объявлений в холле одна на всё общежитие — это *статическое поле*. Кто бы ни написал на доске, увидят все.

Модификатор **\`static\`** означает «принадлежит **классу**, а не объекту»:

| | Поле/метод экземпляра | \`static\` поле/метод |
|---|---|---|
| Сколько копий | Своя у каждого объекта | Одна на весь класс |
| Как обращаться | \`объект.поле\`, \`объект.метод()\` | \`Класс.поле\`, \`Класс.метод()\` |
| Когда появляется | При создании объекта (\`new\`) | При загрузке и инициализации класса |
| Есть ли \`this\` | Да | **Нет** |

### Пример: счётчик созданных объектов

\`\`\`java
class Student {
    private static int count = 0;   // одно поле на весь класс
    private final int id;           // у каждого объекта своё
    private final String name;

    Student(String name) {
        count++;                    // общий счётчик
        this.id = count;            // номер этого студента
        this.name = name;
    }

    static int getCount() {         // метод класса
        return count;
    }

    @Override
    public String toString() {
        return "#" + id + " " + name;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Student.getCount()); // выведет: 0 — объектов ещё нет, а метод уже можно вызвать
        Student a = new Student("Аня");
        Student b = new Student("Борис");
        Student c = new Student("Вера");
        System.out.println(b);                  // выведет: #2 Борис
        System.out.println(Student.getCount()); // выведет: 3
    }
}
\`\`\`

### Статические методы

Статический метод вызывается **без объекта**: \`Math.max(3, 7)\`, \`Integer.parseInt("42")\`, \`Student.getCount()\`. Поэтому внутри него **нет \`this\`** и нельзя напрямую обращаться к полям и методам экземпляра — непонятно, *чьё* поле имеется в виду.

\`\`\`java
class Student {
    String name;
    static int count;

    static void printInfo() {
        System.out.println(count);    // ОК: статическое поле
        // System.out.println(name);  // ОШИБКА: non-static variable name cannot be referenced from a static context
        // System.out.println(this);  // ОШИБКА: non-static variable this cannot be referenced from a static context
    }

    void show() {
        System.out.println(name + " из " + count);  // ОК: методу экземпляра доступно всё
    }
}
\`\`\`

Правило в одну строку: **экземпляр видит всё, статика видит только статику** (а к полям объекта может обратиться только через ссылку на объект: \`someStudent.name\`).

Именно поэтому из \`main\` (он \`static\`) нельзя просто вызвать метод экземпляра своего класса — сначала нужно создать объект: \`new Main().run();\`.

Когда делать метод статическим? Когда он не зависит от состояния объекта: утилиты (\`Math.sqrt\`), фабричные методы (\`List.of(...)\`), счётчики класса. Классы-утилиты, состоящие только из статических методов, обычно получают \`private\`-конструктор, чтобы никто не создавал их объекты.

> ⚠️ Подвох: статический метод **можно** вызвать через ссылку на объект (\`a.getCount()\`) — компилятор это допускает, разве что IDE подсветит предупреждение. Вызов определяется **типом переменной**, а не объектом. Поэтому он сработает даже через ссылку, равную \`null\`, без всякого NullPointerException!

\`\`\`java
class Util {
    static int calls = 0;

    static void hello() {
        calls++;
        System.out.println("Привет");
    }
}

public class Main {
    public static void main(String[] args) {
        Util u = null;
        u.hello();                       // выведет: Привет — NPE НЕ будет, объект не нужен
        Util x = new Util();
        Util y = new Util();
        x.calls = 10;                    // на самом деле Util.calls = 10
        System.out.println(y.calls);     // выведет: 10 — поле одно на всех
    }
}
\`\`\`

Так писать не надо (это путает читателя), но на контрольных такие вопросы любят.

## Ключевое слово final

\`final\` означает «присвоить можно только один раз». Смысл зависит от того, к чему он применён.

### final-переменные и параметры

\`\`\`java
class Demo {
    void print(final String text) {
        final int max = 10;
        // max = 20;          // ОШИБКА: cannot assign a value to final variable max
        // text = "другое";   // ОШИБКА: final parameter text may not be assigned
        System.out.println(text + " " + max);
    }
}
\`\`\`

Переменная, которую ни разу не переприсваивали после инициализации, называется *effectively final* («фактически final») — это пригодится для лямбд и анонимных классов.

### final-поля и blank final

Финальное поле нужно инициализировать **ровно один раз**: при объявлении, в блоке инициализации или **в каждом** конструкторе. Поле \`final\` без значения при объявлении называют *blank final* («пустой final»):

\`\`\`java
class Passport {
    private final String number;     // blank final
    private final String country = "RU";

    Passport(String number) {
        this.number = number;        // ОК: присваиваем один раз
    }

    Passport() {
        // если забыть присвоить number здесь — ОШИБКА компиляции:
        // variable number might not have been initialized
        this("000000");
    }
}
\`\`\`

> ⚠️ Подвох: значения по умолчанию (\`0\`, \`null\`) для \`final\`-полей не считаются — компилятор требует явного присваивания на каждом пути выполнения конструктора.

### final-ссылка на изменяемый объект

\`final\` защищает **переменную** (ссылку), а не объект, на который она указывает:

\`\`\`java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        final int[] arr = {1, 2, 3};
        arr[0] = 100;                       // ОК: меняем содержимое массива
        // arr = new int[5];                // ОШИБКА: ссылку менять нельзя

        final List<String> names = new ArrayList<>();
        names.add("Аня");                   // ОК
        // names = new ArrayList<>();       // ОШИБКА
        System.out.println(arr[0] + " " + names);  // выведет: 100 [Аня]
    }
}
\`\`\`

> 💡 Запомни: \`final\` — это «пульт приклеен к одному телевизору», а не «телевизор нельзя переключать».

### Константы: static final

Константа — это поле \`static final\`: одно на класс и неизменяемое. Имена констант пишут ЗАГЛАВНЫМИ_БУКВАМИ_ЧЕРЕЗ_ПОДЧЁРКИВАНИЕ:

\`\`\`java
class Bank {
    public static final double INTEREST_RATE = 0.12;
    public static final int MAX_ACCOUNTS = 5;
}
\`\`\`

Вместо «магических чисел» в коде (\`if (count > 5)\`) пишем \`if (count > Bank.MAX_ACCOUNTS)\` — понятно и меняется в одном месте. Константами из стандартной библиотеки вы уже пользовались: \`Math.PI\`, \`Integer.MAX_VALUE\`.

### final-методы и final-классы

- **\`final\` метод** нельзя переопределить в наследнике.
- **\`final\` класс** нельзя унаследовать. Так сделаны \`String\`, \`Integer\`, \`Math\` — разработчики Java не хотят, чтобы кто-то подменил их поведение.

Подробнее — в уроке про наследование.

## Блоки инициализации

Кроме конструкторов, код инициализации можно писать в **блоках**:

- **Статический блок** \`static { ... }\` выполняется **один раз** — при инициализации класса. Нужен для сложной подготовки статических полей (заполнить таблицу, прочитать настройки).
- **Блок инициализации экземпляра** \`{ ... }\` (без слова \`static\`) выполняется **при создании каждого объекта**, перед телом конструктора. Нужен редко — например, чтобы общий код не дублировать в нескольких конструкторах.

Класс инициализируется **лениво** — при первом «активном» использовании: создание объекта, вызов статического метода, обращение к статическому полю (кроме констант времени компиляции, см. ниже). Просто объявить переменную \`Config c;\` — не использование.

## Порядок инициализации

Это одна из самых популярных тем на контрольных. Для **одного класса** порядок такой:

1. **Один раз, при первом использовании класса:** статические поля и статические блоки — **сверху вниз, в порядке их записи** в коде.
2. **При каждом \`new\`:**
   1. выделяется память, все поля получают значения по умолчанию (\`0\`, \`false\`, \`null\`);
   2. вызывается конструктор; если он начинается с \`this(...)\`, сначала выполняется тот конструктор;
   3. выполняется конструктор предка (\`super(...)\`, явный или неявный);
   4. инициализаторы полей экземпляра и блоки \`{ }\` — **сверху вниз**, в порядке записи;
   5. оставшееся тело конструктора.

\`\`\`java
class Demo {
    static int s = log("1. статическое поле");
    int f = log("3. поле экземпляра");

    static {
        log("2. статический блок");
    }

    {
        log("4. блок экземпляра");
    }

    Demo() {
        log("5. тело конструктора");
    }

    static int log(String msg) {
        System.out.println(msg);
        return 0;
    }
}

public class Main {
    public static void main(String[] args) {
        new Demo();
        System.out.println("--- второй объект ---");
        new Demo();
    }
}
// выведет:
// 1. статическое поле
// 2. статический блок
// 3. поле экземпляра
// 4. блок экземпляра
// 5. тело конструктора
// --- второй объект ---
// 3. поле экземпляра
// 4. блок экземпляра
// 5. тело конструктора
\`\`\`

Обратите внимание: статическая часть выполнилась один раз, а поле экземпляра и блок — перед телом конструктора, хотя в коде блок записан после поля, а конструктор — после всех.

**С наследованием** (подробно — в следующем уроке): сначала статическая инициализация предка, затем потомка; затем для каждого объекта — инициализация предка (поля + блоки + конструктор предка), затем потомка (поля + блоки + конструктор потомка).

### Подвохи порядка инициализации

> ⚠️ Подвох 1: статическое поле не может напрямую сослаться на поле, объявленное *ниже* (\`static int a = b + 1; static int b = 5;\` — ошибка «illegal forward reference»). Но через метод — может, и тогда увидит значение по умолчанию.

\`\`\`java
class Tricky {
    static int a = getB();   // b ещё не инициализировано → 0
    static int b = 5;

    static int getB() {
        return b;
    }
}

class Holder {
    static Holder INSTANCE = new Holder();  // конструктор выполняется ПЕРВЫМ
    static int count = 0;                   // ...а потом count снова обнуляется!

    Holder() {
        count++;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Tricky.a + " " + Tricky.b); // выведет: 0 5
        System.out.println(Holder.count);              // выведет: 0
    }
}
\`\`\`

С \`Holder\` происходит следующее: статические инициализаторы идут сверху вниз. Сначала создаётся \`INSTANCE\` — конструктор увеличивает \`count\` с 0 до 1. Затем выполняется \`static int count = 0;\` — и счётчик снова 0. Если бы у \`count\` не было явного \`= 0\`, ответ был бы 1.

> ⚠️ Подвох 2: обращение к **константе времени компиляции** (\`static final\` примитив или \`String\`, инициализированный литералом) **не** вызывает инициализацию класса — компилятор просто подставляет значение в код.

\`\`\`java
class Config {
    static final int MAX = 10;      // константа времени компиляции
    static int other = 5;           // обычное статическое поле

    static {
        System.out.print("init ");
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Config.MAX);    // выведет: 10 (статический блок не запускался)
        System.out.println(Config.other);  // выведет: init 5
    }
}
\`\`\`

## Типичные ошибки

- Обращение к полю экземпляра или \`this\` из \`static\`-метода (в том числе из \`main\`).
- Счётчик объектов сделан **не** статическим — тогда у каждого объекта свой счётчик, равный 1.
- Ожидание NPE при вызове статического метода через \`null\`-ссылку.
- \`final\`-поле не присвоено в одном из конструкторов.
- Убеждённость, что \`final List\` нельзя изменить.
- Неверный порядок: «конструктор, потом блок инициализации» (на самом деле блок — раньше тела конструктора).

## Шпаргалка

| Конструкция | Когда выполняется / что значит |
|---|---|
| \`static\` поле | Одно на класс; общая память всех объектов |
| \`static\` метод | Без объекта и без \`this\`; видит только статические члены |
| \`static { }\` | Один раз при инициализации класса |
| \`{ }\` | При каждом \`new\`, перед телом конструктора (после \`super(...)\`) |
| \`final\` переменная | Присваивается один раз |
| \`final\` поле | Ровно одно присваивание: при объявлении, в блоке или в каждом конструкторе |
| \`final\` ссылка | Ссылку не поменять, объект — можно |
| \`static final\` | Константа, имя \`UPPER_CASE\` |
| \`final\` метод / класс | Нельзя переопределить / унаследовать |

**Порядок:** статика сверху вниз (один раз) → значения по умолчанию → конструктор предка → поля и блоки экземпляра сверху вниз → тело конструктора.
`,
  tasks: [
    {
      type: 'choice',
      q: 'В классе `Student` есть поле `static int count`. Создано 50 объектов `Student`. Сколько копий поля `count` существует в памяти?',
      options: ['1', '50', '51', '0 — статические поля не хранятся'],
      answer: '1',
      explain: 'Статическое поле принадлежит классу, а не объекту: оно одно, сколько бы объектов ни создали (и существует, даже если объектов нет вовсе).',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (через пробел)\n```java\nclass Student {\n    static int count;\n    int id;\n    String name;\n\n    Student(String name) {\n        this.name = name;\n        id = ++count;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Student a = new Student("Аня");\n        Student b = new Student("Борис");\n        Student c = new Student("Вера");\n        System.out.println(a.id + " " + c.id + " " + Student.count);\n    }\n}\n```',
      answer: ['1 3 3'],
      explain: '`count` общий: с каждым `new` он растёт, и текущее значение копируется в собственное поле `id`. Если бы `count` был НЕ статическим, у каждого объекта был бы свой счётчик, и все `id` равнялись бы 1.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\npublic class Main {\n    int score = 10;\n\n    public static void main(String[] args) {\n        System.out.println(score);\n    }\n}\n```',
      options: [
        'Ошибка компиляции: non-static variable score cannot be referenced from a static context',
        'Выведет `10`',
        'Выведет `0`',
        'NullPointerException при запуске',
      ],
      answer: 'Ошибка компиляции: non-static variable score cannot be referenced from a static context',
      explain: '`main` — статический метод: он работает без объекта, а `score` есть только у объектов `Main`. Непонятно, чьё поле читать.',
    },
    {
      type: 'choice',
      q: 'Код не компилируется. Какие исправления помогут?\n```java\npublic class Main {\n    int score = 10;\n\n    public static void main(String[] args) {\n        System.out.println(score);\n    }\n}\n```',
      options: [
        'Заменить строку на `System.out.println(new Main().score);`',
        'Объявить поле как `static int score = 10;`',
        'Заменить строку на `System.out.println(this.score);`',
        'Сделать поле `public int score = 10;`',
      ],
      answer: ['Заменить строку на `System.out.println(new Main().score);`', 'Объявить поле как `static int score = 10;`'],
      explain: 'Нужен либо объект, у которого есть поле, либо поле класса. `this` в статическом методе не существует, а модификатор доступа к этой проблеме отношения не имеет.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nclass Counter {\n    static int count;\n\n    static void reset() {\n        this.count = 0;\n    }\n}\n```',
      options: [
        'Нет: в статическом методе нет `this`, даже если поле статическое',
        'Да: `count` ведь статическое',
        'Да, но выдаст NPE при вызове',
        'Нет: статические поля нельзя менять',
      ],
      answer: 'Нет: в статическом методе нет `this`, даже если поле статическое',
      explain: 'Ошибка «non-static variable this cannot be referenced from a static context». Правильно: `count = 0;` или `Counter.count = 0;`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Printer {\n    static int printed = 0;\n\n    static void print(String s) {\n        printed++;\n        System.out.print(s + " ");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Printer p = null;\n        p.print("A");\n        Printer q = new Printer();\n        q.printed += 5;\n        Printer.print("B");\n        System.out.println(p.printed);\n    }\n}\n```',
      answer: ['A B 7'],
      hint: 'Статические члены не нуждаются в объекте.',
      explain: 'Вызов статического метода и обращение к статическому полю через ссылку компилятор заменяет на обращение через класс (`Printer.print`, `Printer.printed`), поэтому `null` в `p` ничему не мешает — NPE нет. Счётчик: 1 → 6 → 7.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (через пробел)\n```java\nclass Visit {\n    static int total;\n    int mine;\n\n    Visit() {\n        total++;\n        mine++;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Visit a = new Visit();\n        Visit b = new Visit();\n        Visit c = new Visit();\n        System.out.println(a.total + " " + a.mine + " " + c.total);\n    }\n}\n```',
      answer: ['3 1 3'],
      explain: '`total` — одно поле на класс, его увеличили три раза. `mine` у каждого объекта своё, каждое увеличили один раз. `a.total` и `c.total` — одно и то же поле `Visit.total`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass A {\n    static {\n        System.out.print("S1 ");\n    }\n\n    int x = init("F ");\n\n    {\n        System.out.print("I ");\n    }\n\n    static int y = initStatic("S2 ");\n\n    A() {\n        System.out.print("C ");\n    }\n\n    static int initStatic(String s) {\n        System.out.print(s);\n        return 1;\n    }\n\n    int init(String s) {\n        System.out.print(s);\n        return 1;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        new A();\n        new A();\n    }\n}\n```',
      answer: ['S1 S2 F I C F I C'],
      hint: 'Сначала вся статика (сверху вниз, один раз), потом для каждого объекта: поля и блоки экземпляра сверху вниз, потом тело конструктора.',
      explain: 'Статический блок и статическое поле выполняются в порядке записи, один раз: `S1 S2`. Для каждого объекта: инициализатор поля `x` и блок экземпляра в порядке записи (`F I`), затем тело конструктора (`C`).',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Logger {\n    static {\n        System.out.print("static ");\n    }\n\n    static void log(String s) {\n        System.out.print(s);\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.print("1 ");\n        Logger l = null;\n        System.out.print("2 ");\n        Logger.log("3 ");\n        Logger.log("4 ");\n    }\n}\n```',
      answer: ['1 2 static 3 4'],
      explain: 'Класс инициализируется лениво — при первом активном использовании (здесь первый вызов статического метода). Объявление переменной `Logger l = null;` класс не инициализирует. Статический блок выполняется ровно один раз.',
    },
    {
      type: 'order',
      q: '`class Child extends Parent`. В обоих классах есть статический блок, блок инициализации экземпляра и конструктор, который что-то печатает. Расставьте выводы при **первом** `new Child()` по порядку.',
      items: [
        'статический блок Parent',
        'статический блок Child',
        'блок экземпляра Parent',
        'конструктор Parent',
        'блок экземпляра Child',
        'конструктор Child',
      ],
      join: ' → ',
      explain: 'Сначала инициализируются классы (предок раньше потомка). Затем создаётся объект: конструктор Child первым делом вызывает super(), поэтому полностью инициализируется «родительская часть» (её поля и блоки, затем тело конструктора Parent), и лишь потом — поля, блоки и тело конструктора Child.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (через пробел)\n```java\nclass Registry {\n    static Registry INSTANCE = new Registry();\n    static int created = 0;\n    static int total;\n\n    Registry() {\n        created++;\n        total++;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Registry.created + " " + Registry.total);\n    }\n}\n```',
      answer: ['0 1'],
      hint: 'Статические инициализаторы выполняются строго сверху вниз.',
      explain: 'Сначала выполняется `INSTANCE = new Registry()`: конструктор делает `created` и `total` равными 1. Затем строка `static int created = 0;` снова обнуляет `created`. У `total` нет инициализатора, поэтому его значение 1 остаётся.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\nclass Tricky {\n    static int a = twiceB();\n    static int b = 5;\n\n    static int twiceB() {\n        return b * 2;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Tricky.a + " " + Tricky.b);\n    }\n}\n```',
      options: ['`0 5`', '`10 5`', 'Ошибка компиляции: illegal forward reference', '`0 0`'],
      answer: '`0 5`',
      explain: 'Когда вычисляется `a`, поле `b` ещё не дошло до своей инициализации и равно 0 (значение по умолчанию), поэтому `a = 0 * 2 = 0`. Прямое обращение `static int a = b * 2;` компилятор бы запретил, а через метод — пропускает.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nclass Range {\n    static int from = to - 10;\n    static int to = 100;\n}\n```',
      options: [
        'Нет: illegal forward reference — `to` объявлено ниже',
        'Да, `from` будет равно 90',
        'Да, `from` будет равно -10',
        'Нет: статические поля нельзя инициализировать выражениями',
      ],
      answer: 'Нет: illegal forward reference — `to` объявлено ниже',
      explain: 'Читать по простому имени поле, объявленное ниже, в инициализаторе нельзя — компилятор защищает от «случайного нуля». Сравните с предыдущей задачей, где то же самое делалось через метод.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (через пробел)\n```java\nclass Config {\n    static final int MAX = 10;\n    static int other = 5;\n\n    static {\n        System.out.print("init ");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Config.MAX);\n        System.out.println(Config.other);\n    }\n}\n```',
      answer: ['10 init 5'],
      explain: '`MAX` — константа времени компиляции (`static final` с литералом): компилятор подставляет 10 прямо в код `main`, и класс `Config` не инициализируется. Обращение к обычному статическому полю `other` запускает инициализацию — печатается `init`, затем 5.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли класс?\n```java\nclass User {\n    private final String login;\n    private final int age;\n\n    User(String login, int age) {\n        this.login = login;\n        this.age = age;\n    }\n\n    User(String login) {\n        this.login = login;\n    }\n}\n```',
      options: [
        'Нет: во втором конструкторе final-поле `age` не инициализировано',
        'Да: `age` получит значение по умолчанию 0',
        'Нет: final-поля нельзя присваивать в конструкторе',
        'Нет: нельзя иметь два конструктора с final-полями',
      ],
      answer: 'Нет: во втором конструкторе final-поле `age` не инициализировано',
      explain: 'Ошибка «variable age might not have been initialized». Каждое final-поле обязано получить значение ровно один раз на каждом пути создания объекта. Исправление: `User(String login) { this(login, 18); }`.',
    },
    {
      type: 'choice',
      q: 'Какие строки **не скомпилируются**?\n```java\npublic class Main {\n    public static void main(String[] args) {\n        final int[] a = {1, 2, 3};\n        final StringBuilder sb = new StringBuilder("Hi");\n        a[0] = 10;                  // 1\n        a = new int[3];             // 2\n        sb.append("!");             // 3\n        sb = new StringBuilder();   // 4\n    }\n}\n```',
      options: ['1', '2', '3', '4'],
      answer: ['2', '4'],
      explain: '`final` запрещает переприсваивать переменную (ссылку), но не мешает менять объект, на который она указывает. Элементы массива и содержимое `StringBuilder` менять можно.',
    },
    {
      type: 'gaps',
      q: 'Допишите класс билета: общий лимит мест — константа, общий счётчик проданных билетов, у каждого билета свой неизменяемый номер',
      code: true,
      caseSensitive: true,
      text: 'class Ticket {\n    public [static final|final static] int MAX_SEATS = 100;\n    private [static] int sold = 0;\n    private [final] int number;\n\n    Ticket() {\n        if (sold >= MAX_SEATS) {\n            throw new IllegalStateException("Мест нет");\n        }\n        sold++;\n        number = sold;\n    }\n\n    public [static] int getSold() {\n        return sold;\n    }\n\n    public int getNumber() {\n        return number;\n    }\n}',
      explain: 'Константа — `static final` (порядок модификаторов не важен, но принято `static final`). Счётчик — `static`, чтобы он был один на класс. Номер — `final`: присваивается один раз в конструкторе. Метод `getSold` не зависит от конкретного билета — он статический.',
    },
    {
      type: 'choice',
      q: 'Какие фрагменты вызовут **ошибку компиляции**?',
      options: [
        '`class MyString extends String { }`',
        '`class A { final void f() { } }  class B extends A { void f() { } }`',
        '`final class Point { }  ... Point p = new Point();`',
        '`class A { final void f() { } }  ... new A().f();`',
      ],
      answer: ['`class MyString extends String { }`', '`class A { final void f() { } }  class B extends A { void f() { } }`'],
      explain: '`String` — final-класс, от него нельзя наследоваться («cannot inherit from final String»). Final-метод нельзя переопределить («overridden method is final»). А создавать объекты final-класса и вызывать final-методы можно без ограничений.',
    },
    {
      type: 'match',
      q: 'Соедините конструкцию и её смысл',
      pairs: [
        ['`static int count;`', 'Одно поле на весь класс'],
        ['`static void f()`', 'Метод, вызываемый без объекта и без `this`'],
        ['`static { ... }`', 'Выполняется один раз при инициализации класса'],
        ['`{ ... }` в теле класса', 'Выполняется при каждом создании объекта, до тела конструктора'],
        ['`static final int MAX = 5;`', 'Константа'],
        ['`private final String id;` без значения', 'Blank final: присвоить нужно в конструкторе'],
      ],
    },
    {
      type: 'choice',
      q: 'Зачем у класса-утилиты вроде `final class MathUtils` (только статические методы) делают `private`-конструктор?',
      options: [
        'Чтобы никто не мог создать бессмысленный объект этого класса',
        'Чтобы статические методы работали быстрее',
        'Без этого статические методы не скомпилируются',
        'Чтобы методы стали неизменяемыми',
      ],
      answer: 'Чтобы никто не мог создать бессмысленный объект этого класса',
      explain: 'У утилитного класса нет состояния, объекты ему не нужны. Если не написать конструктор, компилятор добавит публичный конструктор по умолчанию, и `new MathUtils()` станет возможным. Так устроен, например, `java.lang.Math`.',
    },
    {
      type: 'flashcard',
      front: 'Порядок инициализации при `new` для одного класса (с учётом статики)',
      back: '1) Один раз при первом использовании класса: статические поля и static-блоки сверху вниз.\n2) Для каждого объекта: значения по умолчанию → вызов конструктора (`this(...)` / `super(...)`) → поля экземпляра и блоки `{ }` сверху вниз → оставшееся тело конструктора.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Почему из статического метода нельзя обратиться к полю экземпляра?',
      back: 'Статический метод принадлежит классу и вызывается **без объекта** — у него нет `this`. Полей экземпляра может быть сколько угодно (по одному на объект) или ни одного, поэтому непонятно, чьё поле имеется в виду. Обратиться можно только через явную ссылку: `obj.field`.',
    },
    {
      type: 'flashcard',
      front: 'Делает ли `final List<String> list` список неизменяемым?',
      back: 'Нет. `final` запрещает только переприсваивать **переменную** (`list = ...`). Сам список можно менять: `list.add(...)`, `list.clear()`. Для неизменяемого списка нужен `List.of(...)`, `List.copyOf(...)` или `Collections.unmodifiableList(...)`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Employee`:\n- константа `COMPANY = "ООО Ромашка"`;\n- каждому сотруднику автоматически назначается неизменяемый табельный номер, начиная с 1000 (1000, 1001, …);\n- статический метод `getHiredCount()` — сколько сотрудников создано;\n- `toString()` вида `1000 Аня (ООО Ромашка)`.',
      starter: `class Employee {

}

public class Main {
    public static void main(String[] args) {
        Employee a = new Employee("Аня");
        Employee b = new Employee("Борис");
        System.out.println(a);                        // 1000 Аня (ООО Ромашка)
        System.out.println(b);                        // 1001 Борис (ООО Ромашка)
        System.out.println(Employee.getHiredCount()); // 2
    }
}`,
      solution: `class Employee {
    public static final String COMPANY = "ООО Ромашка";
    private static final int FIRST_NUMBER = 1000;
    private static int hired = 0;

    private final int number;
    private final String name;

    Employee(String name) {
        this.name = name;
        this.number = FIRST_NUMBER + hired;
        hired++;
    }

    static int getHiredCount() {
        return hired;
    }

    int getNumber() {
        return number;
    }

    @Override
    public String toString() {
        return number + " " + name + " (" + COMPANY + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        Employee a = new Employee("Аня");
        Employee b = new Employee("Борис");
        System.out.println(a);                        // 1000 Аня (ООО Ромашка)
        System.out.println(b);                        // 1001 Борис (ООО Ромашка)
        System.out.println(Employee.getHiredCount()); // 2
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите утилитный класс `MathUtils`, объекты которого создать нельзя:\n- константа `EPS = 1e-9`;\n- `static int clamp(int value, int min, int max)` — «зажимает» значение в диапазон;\n- `static double average(int[] arr)` — среднее (для пустого массива — 0);\n- `static boolean almostEqual(double a, double b)` — равны ли числа с точностью `EPS`.',
      solution: `final class MathUtils {
    public static final double EPS = 1e-9;

    private MathUtils() {
        // объекты утилитного класса не нужны
    }

    static int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    static double average(int[] arr) {
        if (arr.length == 0) return 0;
        long sum = 0;
        for (int x : arr) {
            sum += x;
        }
        return (double) sum / arr.length;
    }

    static boolean almostEqual(double a, double b) {
        return Math.abs(a - b) < EPS;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(MathUtils.clamp(150, 0, 100));            // 100
        System.out.println(MathUtils.average(new int[] {1, 2, 4}));  // 2.3333333333333335
        System.out.println(MathUtils.almostEqual(0.1 + 0.2, 0.3));   // true
        // new MathUtils();  // ошибка: MathUtils() has private access
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Circle` с **закрытым** конструктором и статическими фабричными методами `Circle.ofRadius(double r)` и `Circle.ofDiameter(double d)`. Отрицательный размер — `IllegalArgumentException`. Добавьте статический счётчик созданных кругов, метод `area()` (используйте `Math.PI`) и `toString()`.',
      solution: `class Circle {
    private static int created = 0;
    private final double radius;

    private Circle(double radius) {
        if (radius < 0) {
            throw new IllegalArgumentException("Отрицательный радиус");
        }
        this.radius = radius;
        created++;
    }

    static Circle ofRadius(double r) {
        return new Circle(r);
    }

    static Circle ofDiameter(double d) {
        return new Circle(d / 2);
    }

    static int getCreated() {
        return created;
    }

    double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public String toString() {
        return "Circle(r=" + radius + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        Circle a = Circle.ofRadius(1);
        Circle b = Circle.ofDiameter(10);
        System.out.println(a + " " + a.area()); // Circle(r=1.0) 3.141592653589793
        System.out.println(b);                  // Circle(r=5.0)
        System.out.println(Circle.getCreated()); // 2
    }
}`,
      explain: 'Фабричные методы с говорящими именами понятнее перегруженных конструкторов: `new Circle(10)` — это радиус или диаметр? А `Circle.ofDiameter(10)` — однозначно.',
    },
  ],
});
