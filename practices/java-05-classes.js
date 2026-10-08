// Java 5. Классы и объекты. Теория — в поле lesson, задания — в tasks.
Trainer.add({
  id: 'java-05-classes',
  title: 'Java 5. Классы и объекты',
  subject: 'Java',
  description: 'Основа ООП: классы и объекты, поля и методы, ссылки и null, конструкторы, this и toString.',
  lesson: `
## Зачем нужно ООП

Представьте, что вы пишете программу для деканата. У каждого студента есть имя, группа и средний балл. Без классов приходится хранить данные в нескольких «параллельных» массивах:

\`\`\`java
public class Main {
    public static void main(String[] args) {
        // Плохо: данные одного студента разбросаны по трём массивам
        String[] names = {"Аня", "Борис"};
        String[] groups = {"ИВТ-11", "ИВТ-12"};
        double[] grades = {4.5, 3.9};

        // Легко ошибиться индексом и «перепутать» студентов,
        // а добавить новое свойство — значит менять код во многих местах
        System.out.println(names[1] + " " + groups[1] + " " + grades[1]); // выведет: Борис ИВТ-12 3.9
    }
}
\`\`\`

**Объектно-ориентированное программирование (ООП)** предлагает другой взгляд: программа — это набор *объектов*, каждый из которых хранит свои данные и сам умеет с ними работать. Студент — это не «элемент номер 1 в трёх массивах», а один объект, у которого есть имя, группа, балл и действия (например, «сдать экзамен»).

Что даёт ООП:
- **Понятная модель.** Код похож на предметную область: \`Student\`, \`Order\`, \`BankAccount\` — сущности, которые легко обсуждать с заказчиком.
- **Данные и поведение вместе.** Метод, считающий стипендию, лежит рядом с баллом, от которого зависит.
- **Масштабируемость.** Новое поле добавляется в одном месте — в классе.
- **Повторное использование.** Один класс — сколько угодно объектов.

На ООП держатся четыре принципа: **инкапсуляция, наследование, полиморфизм, абстракция**. В этом уроке — фундамент: классы, объекты, ссылки и конструкторы.

## Класс и объект

**Класс** — это описание (чертёж, шаблон) того, какие данные и действия будут у объектов. **Объект** (экземпляр класса) — конкретная «вещь», созданная по этому чертежу.

> 💡 Аналогия: класс — это форма для печенья, объекты — печеньки. Форма одна, печенек сколько угодно, и каждую можно украсить по-своему. Или: класс — чертёж дома, объект — построенный дом по конкретному адресу.

У любого объекта есть три характеристики:
- **Состояние** — значения его полей (имя «Аня», балл 4.5).
- **Поведение** — методы, которые можно у него вызвать (\`study()\`, \`getInfo()\`).
- **Идентичность** — это *отдельный* объект, даже если состояние совпадает с другим. Два студента по имени «Аня» с баллом 4.5 — всё равно два разных человека.

\`\`\`java
class Student {
    // Поля (состояние)
    String name;
    String group;
    double grade;

    // Метод экземпляра (поведение): работает с полями ЭТОГО объекта
    void study(double bonus) {
        grade = grade + bonus;
    }

    String getInfo() {
        return name + " (" + group + "), балл " + grade;
    }
}

public class Main {
    public static void main(String[] args) {
        Student anya = new Student();   // создаём объект
        anya.name = "Аня";               // обращаемся к полям через точку
        anya.group = "ИВТ-11";
        anya.grade = 4.0;
        anya.study(0.5);                 // вызываем метод у конкретного объекта

        Student boris = new Student();   // второй, независимый объект
        boris.name = "Борис";

        System.out.println(anya.getInfo());  // выведет: Аня (ИВТ-11), балл 4.5
        System.out.println(boris.getInfo()); // выведет: Борис (null), балл 0.0
    }
}
\`\`\`

Обратите внимание:
- **Методы экземпляра** (без слова \`static\`) вызываются *у объекта*: \`anya.study(0.5)\`. Внутри метода \`grade\` означает поле того объекта, у которого метод вызван.
- У Бориса поля \`group\` и \`grade\` мы не задали — они получили **значения по умолчанию**.

## Значения полей по умолчанию

Поля объекта всегда инициализируются автоматически:

| Тип поля | Значение по умолчанию |
|---|---|
| \`byte\`, \`short\`, \`int\`, \`long\` | \`0\` |
| \`float\`, \`double\` | \`0.0\` |
| \`char\` | \`'\\u0000'\` (символ с кодом 0) |
| \`boolean\` | \`false\` |
| любой ссылочный тип (\`String\`, массивы, свои классы) | \`null\` |

> ⚠️ Подвох: это правило — только для **полей** (и элементов массивов). **Локальные переменные** (объявленные внутри метода) значений по умолчанию не получают: попытка прочитать неинициализированную локальную переменную — ошибка компиляции «variable might not have been initialized».

\`\`\`java
public class Main {
    int field;              // поле: будет 0

    void test() {
        int local;
        // System.out.println(local); // НЕ скомпилируется: local не инициализирована
        System.out.println(field);    // выведет: 0
    }

    public static void main(String[] args) {
        new Main().test();
    }
}
\`\`\`

## Оператор new и ссылки

Запись \`Student anya = new Student();\` делает три вещи:
1. \`Student anya\` — объявляет **переменную-ссылку** типа \`Student\`.
2. \`new Student()\` — выделяет память под объект в **куче** (heap), заполняет поля значениями по умолчанию и вызывает **конструктор**.
3. \`=\` — кладёт в переменную **ссылку** (адрес) на созданный объект.

Ключевая мысль: **переменная хранит не объект, а ссылку на него**. Как пульт от телевизора: пульт — не телевизор, но через него телевизором можно управлять. Несколько пультов могут управлять одним телевизором.

\`\`\`java
class Cat {
    String name;
    int age;
}

public class Main {
    public static void main(String[] args) {
        Cat a = new Cat();
        a.name = "Барсик";
        Cat b = a;          // копируется ССЫЛКА, новый кот не создаётся
        b.name = "Мурзик";  // меняем объект через вторую ссылку
        System.out.println(a.name);  // выведет: Мурзик

        Cat c = new Cat();
        c.name = "Мурзик";
        System.out.println(a == b);  // выведет: true  (одна и та же ссылка)
        System.out.println(a == c);  // выведет: false (разные объекты, хоть и с одинаковым именем)
    }
}
\`\`\`

> ⚠️ Подвох: для объектов \`==\` сравнивает **ссылки** (тот же ли это объект), а не содержимое. Сравнение «по содержимому» делается методом \`equals\` — ему посвящён отдельный урок.

### null и NullPointerException

Ссылка может никуда не указывать — тогда в ней \`null\` («пульт без телевизора»). Попытка обратиться к полю или методу через \`null\`-ссылку приводит к исключению **\`NullPointerException\`** (NPE) во время выполнения. Компилятор такую ошибку не ловит.

\`\`\`java
class Cat {
    String name;
}

public class Main {
    public static void main(String[] args) {
        Cat cat = null;
        System.out.println(cat);            // выведет: null (сама ссылка печатается спокойно)
        System.out.println(cat.name);       // NullPointerException во время выполнения!
    }
}
\`\`\`

Частый источник NPE — массив объектов: \`new Cat[3]\` создаёт **массив из трёх ссылок, равных \`null\`**, а не трёх котов. Каждый объект нужно создать отдельно: \`cats[0] = new Cat();\`.

## Конструкторы

Заполнять поля по одному после создания неудобно и опасно: легко забыть какое-то поле. **Конструктор** — специальный блок кода, который выполняется при создании объекта и приводит его в правильное начальное состояние.

Правила конструктора:
- имя **совпадает с именем класса**;
- **нет типа возвращаемого значения** (даже \`void\`);
- вызывается только через \`new\` (или из другого конструктора).

\`\`\`java
class Student {
    String name;
    String group;
    double grade;

    Student(String name, String group) {
        this.name = name;     // this.name — поле, name — параметр
        this.group = group;
        this.grade = 3.0;     // все новые студенты начинают с 3.0
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student("Аня", "ИВТ-11");
        System.out.println(s.name + " " + s.grade); // выведет: Аня 3.0
    }
}
\`\`\`

### Конструктор по умолчанию — и когда он исчезает

Если вы **не написали ни одного** конструктора, компилятор сам добавит пустой конструктор без параметров — **конструктор по умолчанию**. Именно поэтому работало \`new Cat()\`.

> ⚠️ Подвох: как только в классе появляется **хотя бы один** конструктор (любой), конструктор по умолчанию **больше не создаётся**. Если в классе есть только \`Student(String name, String group)\`, то \`new Student()\` — ошибка компиляции. Нужен конструктор без параметров — напишите его явно.

### Ловушка: «конструктор» с void

\`\`\`java
class Student {
    String name;

    public void Student() {     // это НЕ конструктор, а обычный метод с именем Student!
        name = "Неизвестно";
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();  // работает конструктор по умолчанию
        System.out.println(s.name); // выведет: null
    }
}
\`\`\`

Из-за \`void\` компилятор считает это методом (да, метод может называться как класс — это законно, но ужасный стиль). Конструктора в классе нет, поэтому добавился пустой конструктор по умолчанию, и поле осталось \`null\`.

### Ключевое слово this

\`this\` — ссылка на **текущий объект** (тот, чей конструктор или метод сейчас выполняется). Главные применения:

1. **Различить поле и параметр с одинаковым именем.** Параметр «затеняет» (shadowing) поле, поэтому без \`this\` вы обращаетесь к параметру.

\`\`\`java
class Bad {
    String name;
    Bad(String name) {
        name = name;          // Плохо: параметр присваивается сам себе, поле остаётся null
    }
}

class Good {
    String name;
    Good(String name) {
        this.name = name;     // Хорошо: поле объекта = параметр
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Bad("Аня").name);  // выведет: null
        System.out.println(new Good("Аня").name); // выведет: Аня
    }
}
\`\`\`

2. **Передать текущий объект** куда-то ещё или вернуть его из метода (\`return this;\` — так строятся цепочки вызовов \`obj.a().b().c()\`).

3. **Вызвать другой конструктор этого же класса**: \`this(...)\`.

### Перегрузка конструкторов и this(...)

Конструкторов может быть несколько — с разными списками параметров (**перегрузка**). Чтобы не дублировать код, один конструктор вызывает другой через \`this(...)\`:

\`\`\`java
class Rectangle {
    double width;
    double height;

    Rectangle(double width, double height) {   // «главный» конструктор
        this.width = width;
        this.height = height;
        System.out.println("Создан " + width + "x" + height);
    }

    Rectangle(double side) {                    // квадрат
        this(side, side);                       // делегируем главному
    }

    Rectangle() {                               // единичный квадрат
        this(1);
    }

    double area() {
        return width * height;
    }
}

public class Main {
    public static void main(String[] args) {
        Rectangle r = new Rectangle();  // выведет: Создан 1.0x1.0
        System.out.println(r.area());   // выведет: 1.0
    }
}
\`\`\`

> ⚠️ Подвох: вызов \`this(...)\` должен быть **первой инструкцией** конструктора (так в Java 17; послабление появилось лишь в Java 25). Нельзя вызвать \`this(...)\` дважды или из обычного метода. Если конструкторы вызывают друг друга по кругу, компилятор выдаст ошибку «recursive constructor invocation».

Хорошая практика — один «главный» конструктор, который делает всю работу (и проверки), а остальные лишь подставляют значения по умолчанию и передают ему управление.

## Метод toString

Что напечатает \`System.out.println(r)\`, если \`r\` — объект нашего класса? Java вызовет у объекта метод \`toString()\`. Если вы его не написали, используется унаследованная от класса \`Object\` версия, которая выдаёт **имя класса и хеш-код** в шестнадцатеричном виде — что-то вроде \`Rectangle@1b6d3586\`. Пользы от этого мало.

Напишите свой \`toString\` — и объект будет печататься понятно (аннотация \`@Override\` подробно разбирается в уроке про наследование):

\`\`\`java
class Point {
    int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public String toString() {
        return "(" + x + ", " + y + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        Point p = new Point(2, 3);
        System.out.println(p);                // выведет: (2, 3)
        System.out.println("Точка: " + p);    // выведет: Точка: (2, 3) — при конкатенации тоже вызывается toString
        Point q = null;
        System.out.println(q);                // выведет: null — println сам проверяет null
        System.out.println("q = " + q);       // выведет: q = null
        // System.out.println(q.toString());  // а вот так — NullPointerException
    }
}
\`\`\`

> ⚠️ Подвох: \`toString\` должен быть именно \`public String toString()\` без параметров. Если написать \`String toString()\` без \`public\` — ошибка компиляции (нельзя сужать доступ). Если ошибиться в имени (\`tostring\`) — получится новый метод, а печататься будет по-прежнему \`Point@...\`. Аннотация \`@Override\` поймала бы эту ошибку.

## Объекты как параметры и сборщик мусора

Объекты можно передавать в методы и возвращать из них — передаётся **копия ссылки**. Поэтому метод может *изменить* переданный объект, но не может заставить внешнюю переменную указывать на другой объект:

\`\`\`java
class Cat {
    String name;
    Cat(String name) { this.name = name; }
}

public class Main {
    static void rename(Cat c) {
        c.name = "Рыжик";        // меняем объект — видно снаружи
    }

    static void replace(Cat c) {
        c = new Cat("Пушок");    // меняем только локальную копию ссылки
    }

    public static void main(String[] args) {
        Cat cat = new Cat("Барсик");
        rename(cat);
        replace(cat);
        System.out.println(cat.name); // выведет: Рыжик
    }
}
\`\`\`

Удалять объекты вручную в Java не нужно (и нельзя — нет оператора \`delete\`). Этим занимается **сборщик мусора** (Garbage Collector, GC). Объект становится «мусором», когда на него **не осталось ни одной достижимой ссылки** — например, переменной присвоили \`null\` или другой объект. Когда именно GC освободит память — не определено; \`System.gc()\` лишь *просит* JVM запустить сборку, но ничего не гарантирует. Пушок из примера выше станет мусором сразу после выхода из \`replace\`.

## Типичные ошибки

- Обращение к полю/методу через \`null\` → \`NullPointerException\`.
- \`name = name;\` в конструкторе вместо \`this.name = name;\` → поле не заполняется.
- \`void\` у «конструктора» → это метод, конструктор не вызывается.
- Добавили конструктор с параметрами — и сломались все \`new X()\` в программе.
- Сравнение объектов через \`==\`, когда нужно сравнить содержимое.
- \`new Cat[5]\` — не пять котов, а пять \`null\`.

## Шпаргалка

| Понятие | Суть |
|---|---|
| Класс | Шаблон: поля + методы + конструкторы |
| Объект | Экземпляр класса в куче: состояние, поведение, идентичность |
| Ссылка | Переменная, хранящая адрес объекта (или \`null\`) |
| \`new\` | Создаёт объект, вызывает конструктор, возвращает ссылку |
| Конструктор | Имя = имя класса, нет типа возврата, инициализирует объект |
| Конструктор по умолчанию | Добавляется, только если нет ни одного своего конструктора |
| \`this\` | Ссылка на текущий объект; \`this(...)\` — вызов другого конструктора (первой строкой) |
| \`toString()\` | Строковое представление; без переопределения — \`ИмяКласса@хеш\` |
| \`==\` для объектов | Сравнивает ссылки, а не содержимое |
| GC | Удаляет объекты, на которые не осталось ссылок, в неопределённый момент |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Что верно о связи **класса** и **объекта**?',
      options: [
        'Класс — шаблон (описание), объект — конкретный экземпляр, созданный по этому шаблону',
        'Объект — шаблон, класс — его конкретный экземпляр',
        'Класс и объект — синонимы',
        'По одному классу можно создать только один объект',
      ],
      answer: 'Класс — шаблон (описание), объект — конкретный экземпляр, созданный по этому шаблону',
      explain: 'Класс описывает, какие поля и методы будут у объектов. По одному классу можно создать сколько угодно объектов — как печенья по одной форме.',
    },
    {
      type: 'choice',
      q: 'Какие три характеристики есть у любого объекта в ООП?',
      options: ['Состояние', 'Поведение', 'Идентичность', 'Наследование', 'Компиляция'],
      answer: ['Состояние', 'Поведение', 'Идентичность'],
      explain: 'Состояние — значения полей, поведение — методы, идентичность — объект отличается от других, даже если поля совпадают. Наследование — принцип ООП, а не характеристика объекта.',
    },
    {
      type: 'match',
      q: 'Соедините термин и его описание',
      pairs: [
        ['Поле', 'Переменная внутри класса, хранит состояние объекта'],
        ['Метод экземпляра', 'Действие, которое вызывается у конкретного объекта'],
        ['Конструктор', 'Блок кода, выполняемый при создании объекта через new'],
        ['Ссылка', 'Переменная, которая хранит адрес объекта или null'],
        ['`this`', 'Ссылка на текущий объект'],
        ['Сборщик мусора', 'Освобождает память объектов, на которые не осталось ссылок'],
      ],
    },
    {
      type: 'input',
      q: 'Что выведет программа? (запишите через пробел)\n```java\nclass Phone {\n    String model;\n    int battery;\n    boolean on;\n    double price;\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Phone p = new Phone();\n        System.out.println(p.model + " " + p.battery + " " + p.on + " " + p.price);\n    }\n}\n```',
      answer: ['null 0 false 0.0'],
      explain: 'Поля получают значения по умолчанию: ссылки — `null`, `int` — `0`, `boolean` — `false`, `double` — `0.0`.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\npublic class Main {\n    int count;\n\n    public static void main(String[] args) {\n        int total;\n        Main m = new Main();\n        System.out.println(m.count);\n        System.out.println(total);\n    }\n}\n```',
      options: [
        'Нет: локальная переменная `total` не инициализирована',
        'Нет: поле `count` не инициализировано',
        'Да, выведет `0` и `0`',
        'Да, но при запуске будет NullPointerException',
      ],
      answer: 'Нет: локальная переменная `total` не инициализирована',
      explain: 'Значения по умолчанию получают только поля и элементы массивов. Локальную переменную нужно инициализировать перед чтением — иначе ошибка «variable total might not have been initialized». Поле `count` при этом в порядке: оно равно 0.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Cat {\n    String name;\n    int age;\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Cat a = new Cat();\n        a.age = 3;\n        Cat b = a;\n        b.age = 5;\n        Cat c = new Cat();\n        c.age = a.age;\n        c.age++;\n        System.out.println(a.age + " " + b.age + " " + c.age);\n    }\n}\n```',
      answer: ['5 5 6'],
      explain: '`Cat b = a` копирует ссылку: `a` и `b` указывают на один объект, поэтому `b.age = 5` видно и через `a`. Объект `c` отдельный: в него скопировали число 5, затем увеличили до 6.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (два значения через пробел)\n```java\nclass Point {\n    int x, y;\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Point p1 = new Point();\n        Point p2 = new Point();\n        Point p3 = p1;\n        System.out.println((p1 == p2) + " " + (p1 == p3));\n    }\n}\n```',
      answer: ['false true'],
      explain: '`==` для объектов сравнивает ссылки. `p1` и `p2` — два разных объекта (хоть поля и одинаковые), а `p3` указывает на тот же объект, что и `p1`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nclass Cat {\n    String name;\n\n    String greet() {\n        return "Мяу, я " + name;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Cat cat = null;\n        System.out.println(cat.greet());\n    }\n}\n```',
      options: [
        'Программа скомпилируется, но при запуске выбросит `NullPointerException`',
        'Ошибка компиляции: нельзя вызывать метод у `null`',
        'Выведет `Мяу, я null`',
        'Выведет `null`',
      ],
      answer: 'Программа скомпилируется, но при запуске выбросит `NullPointerException`',
      explain: 'Компилятор проверяет только типы: у типа `Cat` метод `greet()` есть. А то, что в переменной `null`, выясняется лишь во время выполнения — вызов метода через `null` даёт NPE.',
    },
    {
      type: 'choice',
      q: 'Сколько объектов `Student` создаёт строка `Student[] group = new Student[30];`?',
      options: ['0', '1', '30', '31'],
      answer: '0',
      explain: 'Создаётся один объект-массив из 30 ссылок, и все они равны `null`. Объекты-студенты нужно создавать отдельно: `group[i] = new Student(...)`. Поэтому `group[0].name` здесь даст NullPointerException.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\nclass Student {\n    String name;\n\n    public void Student() {\n        name = "Неизвестно";\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Student s = new Student();\n        System.out.println(s.name);\n    }\n}\n```',
      options: ['`null`', '`Неизвестно`', 'Ошибка компиляции: у конструктора не может быть `void`', 'Ошибка компиляции: метод не может называться как класс'],
      answer: '`null`',
      explain: 'Из-за `void` это не конструктор, а обычный метод с именем `Student` (так писать законно, но плохо). Конструкторов в классе нет, поэтому компилятор добавил пустой конструктор по умолчанию, и `name` осталось `null`. Метод `Student()` никто не вызвал.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nclass Book {\n    String title;\n\n    Book(String title) {\n        this.title = title;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Book a = new Book("Война и мир");\n        Book b = new Book();\n    }\n}\n```',
      options: [
        'Нет: в классе есть конструктор с параметром, поэтому конструктор по умолчанию не создаётся',
        'Да: конструктор без параметров добавляется всегда',
        'Да, но `b.title` будет `null`',
        'Нет: поле `title` должно быть инициализировано',
      ],
      answer: 'Нет: в классе есть конструктор с параметром, поэтому конструктор по умолчанию не создаётся',
      explain: 'Компилятор добавляет конструктор по умолчанию, только если в классе нет ни одного конструктора. Чтобы `new Book()` работал, нужно явно написать `Book() { ... }`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Dog {\n    String name;\n\n    Dog(String name) {\n        name = name;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Dog d = new Dog("Шарик");\n        System.out.println(d.name);\n    }\n}\n```',
      answer: ['null'],
      explain: 'Параметр `name` затеняет поле. `name = name` присваивает параметр самому себе, поле не меняется и остаётся `null`. Правильно: `this.name = name;`.',
    },
    {
      type: 'gaps',
      q: 'Допишите класс: конструктор с двумя параметрами заполняет поля, конструктор без параметров создаёт товар «Без названия» по цене 0 через вызов другого конструктора.',
      code: true,
      caseSensitive: true,
      text: 'class Product {\n    String title;\n    double price;\n\n    [Product](String title, double price) {\n        [this].title = title;\n        this.price = [price];\n    }\n\n    Product() {\n        [this]("Без названия", 0);\n    }\n}',
      explain: 'Имя конструктора совпадает с именем класса. `this.title` — поле, `title` — параметр. `this(...)` вызывает другой конструктор этого же класса и должен стоять первой строкой.',
    },
    {
      type: 'order',
      q: 'Расставьте по порядку, что происходит при выполнении `Cat c = new Cat("Барсик");`',
      items: [
        'Выделяется память под объект в куче',
        'Поля объекта получают значения по умолчанию (0, false, null)',
        'Выполняется конструктор `Cat(String)`',
        'Ссылка на объект сохраняется в переменной `c`',
      ],
      join: ' → ',
      explain: 'Сначала создаётся «пустой» объект с полями по умолчанию, затем конструктор доводит его до рабочего состояния, и только потом ссылка попадает в переменную.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Box {\n    int w, h;\n\n    Box() {\n        this(1);\n        System.out.print("A");\n    }\n\n    Box(int side) {\n        this(side, side);\n        System.out.print("B");\n    }\n\n    Box(int w, int h) {\n        this.w = w;\n        this.h = h;\n        System.out.print("C");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Box b = new Box();\n        System.out.println(" " + b.w * b.h);\n    }\n}\n```',
      answer: ['CBA 1'],
      hint: 'this(...) сначала полностью выполняет вызванный конструктор, а уже потом — остаток текущего.',
      explain: '`Box()` первой строкой вызывает `Box(1)`, тот — `Box(1, 1)`. Самый «глубокий» конструктор печатает `C` первым, затем управление возвращается: `B`, потом `A`. Площадь 1·1 = 1.',
    },
    {
      type: 'choice',
      q: 'Какие конструкторы класса `Car` **не скомпилируются**?\n```java\nclass Car {\n    String model;\n    int year;\n\n    Car(String model, int year) {\n        this.model = model;\n        this.year = year;\n    }\n\n    // Вариант 1\n    Car(String model) {\n        this(model, 2024);\n    }\n\n    // Вариант 2\n    Car(int year) {\n        System.out.println("Создаём");\n        this("Без модели", year);\n    }\n\n    // Вариант 3\n    Car() {\n        this("Без модели");\n        this.year = 2000;\n    }\n}\n```',
      options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Все скомпилируются'],
      answer: 'Вариант 2',
      explain: 'Вызов `this(...)` должен быть первой инструкцией конструктора. В варианте 2 перед ним стоит `println` — ошибка. В варианте 3 `this(...)` первый, а после него можно писать что угодно. (Только начиная с Java 25 перед `this(...)` разрешили некоторые инструкции, но в Java 17 — нет.)',
    },
    {
      type: 'choice',
      q: 'Что скорее всего выведет программа?\n```java\nclass Point {\n    int x, y;\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Point p = new Point();\n        System.out.println(p);\n    }\n}\n```',
      options: ['Что-то вроде `Point@1b6d3586`', '`(0, 0)`', '`x=0, y=0`', '`null`', 'Ошибка компиляции: println не умеет печатать объекты'],
      answer: 'Что-то вроде `Point@1b6d3586`',
      explain: '`println` вызывает у объекта `toString()`. Метод не переопределён, поэтому работает версия из `Object`: имя класса, `@` и хеш-код в шестнадцатеричном виде.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Money {\n    int rub, kop;\n\n    Money(int rub, int kop) {\n        this.rub = rub;\n        this.kop = kop;\n    }\n\n    @Override\n    public String toString() {\n        return rub + " руб. " + kop + " коп.";\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Money m = new Money(12, 50);\n        System.out.println("Итого: " + m);\n    }\n}\n```',
      answer: ['Итого: 12 руб. 50 коп.'],
      explain: 'При конкатенации строки с объектом у объекта неявно вызывается `toString()`.',
    },
    {
      type: 'choice',
      q: 'В какой строке возникнет `NullPointerException`? (класс `Point` с переопределённым `toString`)\n```java\nPoint q = null;\nSystem.out.println(q);              // строка 1\nSystem.out.println("q = " + q);     // строка 2\nSystem.out.println(q.toString());   // строка 3\n```',
      options: ['Только в строке 3', 'Только в строке 1', 'В строках 1 и 3', 'Во всех трёх строках'],
      answer: 'Только в строке 3',
      explain: '`println(Object)` и конкатенация сами проверяют ссылку на `null` и печатают слово `null`. А явный вызов метода `q.toString()` через `null`-ссылку — это NPE.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Cat {\n    String name;\n\n    Cat(String name) {\n        this.name = name;\n    }\n}\n\npublic class Main {\n    static void change(Cat c) {\n        c.name = "Рыжик";\n        c = new Cat("Пушок");\n        c.name = "Снежок";\n    }\n\n    public static void main(String[] args) {\n        Cat cat = new Cat("Барсик");\n        change(cat);\n        System.out.println(cat.name);\n    }\n}\n```',
      answer: ['Рыжик'],
      explain: 'В метод передаётся копия ссылки. Первая строка меняет исходный объект → «Рыжик». Затем локальная `c` начинает указывать на новый объект, и «Снежок» достаётся уже ему, а не коту из `main`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Counter {\n    int value;\n\n    Counter add(int n) {\n        value += n;\n        return this;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Counter c = new Counter();\n        c.add(5).add(10).add(-3);\n        Counter d = c.add(1);\n        d.add(100);\n        System.out.println(c.value);\n    }\n}\n```',
      answer: ['113'],
      explain: '`add` возвращает `this` — ссылку на тот же объект, поэтому цепочка работает с одним счётчиком: 5 + 10 − 3 = 12, затем +1 = 13. `d` — это тоже `c`, поэтому +100 → 113.',
    },
    {
      type: 'number',
      q: 'Сколько объектов `Cat` станут недостижимыми (доступными для сборщика мусора) после выполнения кода?\n```java\nCat a = new Cat();\nCat b = new Cat();\nCat c = a;\na = null;\nb = c;\n```',
      answer: '1',
      explain: 'Создано два объекта. Первый: на него указывали `a` и `c`; после `a = null` остаётся `c` — он достижим. Второй: на него указывала только `b`, но `b = c` перенаправила её на первый объект — второй кот больше недостижим.',
    },
    {
      type: 'gaps',
      q: 'Выберите правильные слова',
      text: 'Переменная типа класса хранит [*ссылку на объект|сам объект|копию объекта]. Объекты создаются в [*куче|стеке|байт-коде]. Конструктор по умолчанию добавляется компилятором, только если в классе [*нет ни одного конструктора|нет полей|нет методов]. У конструктора [*нет типа возвращаемого значения|тип возврата void|тип возврата — сам класс].',
    },
    {
      type: 'flashcard',
      front: 'Что такое конструктор по умолчанию и когда компилятор его создаёт?',
      back: 'Пустой конструктор без параметров, который компилятор добавляет **только если в классе не объявлено ни одного конструктора**. Стоит написать любой свой конструктор — и конструктора по умолчанию больше нет.',
    },
    {
      type: 'flashcard',
      front: 'Три способа использовать `this` в Java',
      back: '1) `this.поле` — отличить поле от параметра с тем же именем;\n2) `this(...)` — вызвать другой конструктор этого класса (первой строкой);\n3) `this` как значение — передать или вернуть текущий объект (`return this;` для цепочек вызовов).',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Rectangle` с полями `width` и `height` (тип `double`):\n- конструктор `Rectangle(double width, double height)`;\n- конструктор `Rectangle(double side)` для квадрата — через `this(...)`;\n- методы `area()` и `perimeter()`;\n- метод `toString()`, возвращающий строку вида `Rectangle 2.0x3.0`.\n\nВ `main` создайте прямоугольник 2×3 и квадрат со стороной 4 и выведите для каждого `toString`, площадь и периметр.',
      starter: `class Rectangle {
    // поля, конструкторы, методы
}

public class Main {
    public static void main(String[] args) {

    }
}`,
      solution: `class Rectangle {
    double width;
    double height;

    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    Rectangle(double side) {
        this(side, side);
    }

    double area() {
        return width * height;
    }

    double perimeter() {
        return 2 * (width + height);
    }

    @Override
    public String toString() {
        return "Rectangle " + width + "x" + height;
    }
}

public class Main {
    public static void main(String[] args) {
        Rectangle r = new Rectangle(2, 3);
        Rectangle sq = new Rectangle(4);
        System.out.println(r + ": S = " + r.area() + ", P = " + r.perimeter());
        // Rectangle 2.0x3.0: S = 6.0, P = 10.0
        System.out.println(sq + ": S = " + sq.area() + ", P = " + sq.perimeter());
        // Rectangle 4.0x4.0: S = 16.0, P = 16.0
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Book` (поля `title`, `author`, `pages`) с конструктором на все три поля и методом `boolean isLongerThan(Book other)`, который сравнивает число страниц **этой** книги и книги `other`. Добавьте `toString()` вида `«Название» (Автор), N стр.`.\n\nВ `main` создайте массив из трёх книг и найдите самую толстую, используя `isLongerThan`.',
      starter: `class Book {

}

public class Main {
    public static void main(String[] args) {
        Book[] books = {
            new Book("Мастер и Маргарита", "Булгаков", 480),
            new Book("Война и мир", "Толстой", 1300),
            new Book("Шинель", "Гоголь", 60),
        };
        // найдите самую толстую книгу
    }
}`,
      solution: `class Book {
    String title;
    String author;
    int pages;

    Book(String title, String author, int pages) {
        this.title = title;
        this.author = author;
        this.pages = pages;
    }

    boolean isLongerThan(Book other) {
        return this.pages > other.pages;
    }

    @Override
    public String toString() {
        return "«" + title + "» (" + author + "), " + pages + " стр.";
    }
}

public class Main {
    public static void main(String[] args) {
        Book[] books = {
            new Book("Мастер и Маргарита", "Булгаков", 480),
            new Book("Война и мир", "Толстой", 1300),
            new Book("Шинель", "Гоголь", 60),
        };
        Book longest = books[0];
        for (Book b : books) {
            if (b.isLongerThan(longest)) {
                longest = b;
            }
        }
        System.out.println("Самая толстая: " + longest);
        // Самая толстая: «Война и мир» (Толстой), 1300 стр.
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Counter` для подсчёта посетителей:\n- поле `name` (название входа) и поле `count`;\n- конструктор `Counter(String name)`;\n- метод `Counter click()`, увеличивающий `count` на 1 и возвращающий `this` (чтобы можно было писать `c.click().click()`);\n- метод `void reset()`;\n- `toString()` вида `Главный вход: 3`.\n\nПокажите в `main`, что две переменные, указывающие на один счётчик, видят общие изменения, а второй счётчик независим.',
      solution: `class Counter {
    String name;
    int count;

    Counter(String name) {
        this.name = name;
    }

    Counter click() {
        count++;
        return this;
    }

    void reset() {
        count = 0;
    }

    @Override
    public String toString() {
        return name + ": " + count;
    }
}

public class Main {
    public static void main(String[] args) {
        Counter main = new Counter("Главный вход");
        Counter alias = main;              // та же ссылка
        Counter back = new Counter("Чёрный ход");

        main.click().click();
        alias.click();
        back.click();

        System.out.println(main);  // Главный вход: 3
        System.out.println(alias); // Главный вход: 3
        System.out.println(back);  // Чёрный ход: 1

        alias.reset();
        System.out.println(main);  // Главный вход: 0
    }
}`,
    },
  ],
});
