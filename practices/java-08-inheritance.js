// Java 8. Наследование. Теория — в поле lesson, задания — в tasks.
Trainer.add({
  id: 'java-08-inheritance',
  title: 'Java 8. Наследование',
  subject: 'Java',
  description: 'Отношение is-a и extends, что наследуется, super(...) и цепочка конструкторов, правила переопределения методов, @Override, super.метод(), класс Object и final.',
  lesson: `
## Зачем нужно наследование

Допустим, в программе зоопарка есть кошки и собаки. У тех и других есть кличка, возраст и умение есть. Наивное решение — скопировать код:

\`\`\`java
// Плохо: одинаковый код в двух классах
class Cat {
    String name;
    int age;
    void eat() { System.out.println(name + " ест"); }
    void meow() { System.out.println("Мяу"); }
}

class Dog {
    String name;
    int age;
    void eat() { System.out.println(name + " ест"); }
    void bark() { System.out.println("Гав"); }
}
\`\`\`

Если завтра понадобится поле \`weight\` или исправить ошибку в \`eat()\`, придётся править каждый класс — и однажды вы забудете один из них. **Наследование** позволяет вынести общее в класс-предок, а в потомках описать только отличия:

\`\`\`java
// Хорошо: общее — в предке, отличия — в потомках
class Animal {
    String name;
    int age;

    void eat() {
        System.out.println(name + " ест");
    }
}

class Cat extends Animal {
    void meow() { System.out.println("Мяу"); }
}

class Dog extends Animal {
    void bark() { System.out.println("Гав"); }
}

public class Main {
    public static void main(String[] args) {
        Dog d = new Dog();
        d.name = "Шарик";   // поле унаследовано от Animal
        d.eat();            // выведет: Шарик ест
        d.bark();           // выведет: Гав
    }
}
\`\`\`

Термины: \`Animal\` — **суперкласс** (родитель, базовый класс, предок); \`Cat\` и \`Dog\` — **подклассы** (потомки, производные классы). Ключевое слово — **\`extends\`** («расширяет»): потомок получает всё, что есть у предка, и добавляет своё.

### Отношение is-a

Наследование уместно, только если выполняется проверка **«является» (is-a)**: «собака *является* животным», «менеджер *является* сотрудником», «студент *является* человеком». Объект потомка можно использовать везде, где ожидается предок.

Если же звучит «*имеет*» (has-a) — «у машины *есть* двигатель», «у заказа *есть* покупатель», — это **не** наследование, а композиция (поле одного класса внутри другого). \`class Car extends Engine\` — классическая ошибка: машина не является двигателем.

> 💡 Аналогия: биологическая классификация. Все млекопитающие кормят детёнышей молоком; кошки — млекопитающие, поэтому тоже; но у кошек есть и свои особенности. Описывать «кормит молоком» для каждого вида отдельно никто не станет.

## Что наследуется, а что нет

| Член класса-предка | Доступен в потомке? |
|---|---|
| \`public\` поля и методы | Да |
| \`protected\` поля и методы | Да (в любом пакете) |
| package-private | Только если потомок в том же пакете |
| \`private\` поля и методы | **Нет** напрямую. Поля физически есть в объекте, но обращаться к ним можно только через методы предка |
| Конструкторы | **Не наследуются** никогда |
| \`static\` члены | Доступны через потомка, но принадлежат предку (не переопределяются) |

> ⚠️ Подвох: конструкторы **не наследуются**. Если у \`Animal\` есть конструктор \`Animal(String name)\`, это не значит, что можно написать \`new Dog("Шарик")\` — у \`Dog\` такого конструктора нет, пока вы его не объявите.

### Одиночное наследование и класс Object

- В Java у класса может быть **только один** прямой предок: \`class C extends A, B\` — ошибка компиляции. Так язык избегает «ромбовидной проблемы» (если A и B оба определяют метод \`m()\`, чью версию брать?). Множественность реализуется через интерфейсы — о них в отдельном уроке.
- Цепочки допустимы: \`SportsCar extends Car\`, \`Car extends Vehicle\`.
- Если \`extends\` не написан, класс неявно наследует **\`java.lang.Object\`**. Поэтому у *любого* объекта есть методы \`toString()\`, \`equals()\`, \`hashCode()\`, \`getClass()\`. \`Object\` — корень иерархии всех классов.

## Конструкторы и super(...)

Объект потомка содержит внутри «родительскую часть», и её должен проинициализировать конструктор предка. Поэтому **любой конструктор первым делом вызывает конструктор предка** — явно через \`super(...)\` или неявно.

\`\`\`java
class Employee {
    private final String name;
    private final double salary;

    Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    String getName() { return name; }

    double getSalary() { return salary; }

    @Override
    public String toString() {
        return name + ", оклад " + getSalary();
    }
}

class Manager extends Employee {
    private final double bonus;

    Manager(String name, double salary, double bonus) {
        super(name, salary);    // 1) инициализируем родительскую часть
        this.bonus = bonus;     // 2) затем свою
    }

    @Override
    double getSalary() {
        return super.getSalary() + bonus;   // версия предка + премия
    }

    @Override
    public String toString() {
        return super.toString() + " (менеджер)";
    }
}

public class Main {
    public static void main(String[] args) {
        Employee e = new Employee("Аня", 100);
        Manager m = new Manager("Борис", 100, 50);
        System.out.println(e);   // выведет: Аня, оклад 100.0
        System.out.println(m);   // выведет: Борис, оклад 150.0 (менеджер)
    }
}
\`\`\`

Обратите внимание: \`name\` и \`salary\` в \`Employee\` — \`private\`, и \`Manager\` не может обратиться к ним напрямую (\`this.salary\` — ошибка). Но это и не нужно: он передаёт значения в \`super(...)\` и пользуется методами предка. Инкапсуляция сохраняется и при наследовании.

Ещё интересное место: \`toString()\` объявлен в \`Employee\`, но вызывает \`getSalary()\` — и для менеджера срабатывает **переопределённая** версия (150.0, а не 100.0). Это и есть полиморфизм — ему посвящён следующий урок.

### Правила вызова super(...)

1. \`super(...)\` должен быть **первой инструкцией** конструктора (в Java 17).
2. В одном конструкторе нельзя вызвать и \`this(...)\`, и \`super(...)\` — оба претендуют на первую строку. Если конструктор начинается с \`this(...)\`, то \`super(...)\` вызовет тот конструктор, которому передано управление.
3. Если вы не написали ни \`this(...)\`, ни \`super(...)\`, компилятор **сам вставит \`super();\`** — вызов конструктора предка без параметров.

> ⚠️ Подвох: если у предка **нет** конструктора без параметров, неявный \`super()\` не скомпилируется. Это касается и конструктора по умолчанию: класс \`class Cat extends Animal { }\` при \`Animal(String name)\` даёт ошибку «constructor Animal in class Animal cannot be applied to given types». Решение — явно вызвать \`super("...")\` в конструкторе потомка.

### Цепочка конструкторов

Конструкторы вызываются «сверху вниз»: первым **завершается** конструктор самого дальнего предка (\`Object\`), последним — конструктор создаваемого класса. Как при строительстве дома: сначала фундамент, потом стены, потом крыша.

\`\`\`java
class Vehicle {
    Vehicle() {
        System.out.println("Vehicle");
    }
}

class Car extends Vehicle {
    Car() {
        // здесь неявно стоит super();
        System.out.println("Car");
    }
}

class SportsCar extends Car {
    SportsCar() {
        super();   // можно написать явно — то же самое
        System.out.println("SportsCar");
    }
}

public class Main {
    public static void main(String[] args) {
        new SportsCar();
    }
}
// выведет:
// Vehicle
// Car
// SportsCar
\`\`\`

Полный порядок создания объекта потомка (дополняет урок про инициализацию):
1. статическая инициализация предка, затем потомка (один раз);
2. поля предка и его блоки инициализации → тело конструктора предка;
3. поля потомка и его блоки инициализации → тело конструктора потомка.

> ⚠️ Подвох: не вызывайте из конструктора предка методы, которые потомок может переопределить. Конструктор предка работает **до** инициализации полей потомка, и переопределённый метод увидит их значения по умолчанию:

\`\`\`java
class Base {
    Base() {
        show();          // вызовется версия потомка!
    }

    void show() {
        System.out.println("Base");
    }
}

class Derived extends Base {
    private String text = "привет";

    @Override
    void show() {
        System.out.println("text = " + text);
    }
}

public class Main {
    public static void main(String[] args) {
        Derived d = new Derived();  // выведет: text = null
        d.show();                   // выведет: text = привет
    }
}
\`\`\`

## Переопределение методов (overriding)

**Переопределение** — потомок даёт **свою реализацию** метода, унаследованного от предка, с той же сигнатурой. Когда метод вызывается у объекта, работает версия из *реального класса объекта*.

Правила переопределения:

1. **Та же сигнатура**: то же имя и тот же список типов параметров. Другие параметры — это уже **перегрузка** (новый метод), а не переопределение.
2. **Тип возвращаемого значения** — тот же или его **подтип** (ковариантный возврат). Если предок возвращает \`Animal\`, потомок может вернуть \`Dog\`. Для примитивов — строго тот же тип.
3. **Доступ нельзя сужать**, можно расширять: \`protected\` → \`protected\` или \`public\`; \`public\` → только \`public\`. Иначе ошибка «attempting to assign weaker access privileges».
4. **Checked-исключения**: нельзя объявлять новые или более общие, чем у предка; можно меньше, более узкие или не объявлять вовсе. Unchecked (\`RuntimeException\` и потомки) — без ограничений.
5. Нельзя переопределить **\`final\`**-метод.
6. **\`static\`**-методы не переопределяются, а **скрываются** (hiding): вызов выбирается по типу переменной, а не объекта.
7. **\`private\`**-методы не наследуются, поэтому и не переопределяются: метод с тем же именем в потомке — просто новый независимый метод.

> 💡 Запомни: «потомок может обещать **больше**, но не меньше». Шире доступ, точнее тип результата, меньше исключений — объект потомка должен подходить везде, где ожидают предка.

\`\`\`java
import java.io.FileNotFoundException;
import java.io.IOException;

class Animal {
    protected Animal makeBaby() {
        return new Animal();
    }

    void load() throws IOException { }
}

class Dog extends Animal {
    @Override
    public Dog makeBaby() {        // ОК: доступ шире, тип результата — подтип
        return new Dog();
    }

    @Override
    void load() throws FileNotFoundException { }  // ОК: более узкое checked-исключение

    // @Override
    // void load() throws Exception { }   // ОШИБКА: более общее checked-исключение
    // @Override
    // Animal makeBaby() { ... }          // ОШИБКА: доступ сужен с protected до package-private
}
\`\`\`

### Аннотация @Override

\`@Override\` перед методом говорит компилятору: «я собираюсь *переопределить* метод предка — проверь». Если метода с такой сигнатурой у предка нет, будет ошибка «method does not override or implement a method from a supertype». Аннотация необязательна, но **всегда пишите её** — она ловит опечатки, которые иначе превращаются в тихие баги:

\`\`\`java
class Point {
    int x, y;

    // Задумывали переопределить toString, но опечатались в имени:
    public String tostring() {          // без @Override — просто новый метод
        return "(" + x + ", " + y + ")";
    }

    // Задумывали переопределить equals(Object), но написали другой параметр —
    // это ПЕРЕГРУЗКА, и коллекции её не увидят.
    // С @Override компилятор сразу сообщил бы об ошибке:
    // @Override
    // public boolean equals(Point other) { ... }   // ОШИБКА: method does not override...
}
\`\`\`

### super.метод()

Внутри переопределённого метода можно вызвать версию предка через \`super.имяМетода(...)\` — чтобы **дополнить** поведение, а не переписать его с нуля (как \`getSalary()\` и \`toString()\` у \`Manager\` выше).

> ⚠️ Подвох: \`super.super.method()\` в Java **не существует** — это синтаксическая ошибка. Обратиться можно только к ближайшему предку.

### Перегрузка и переопределение — не путать

| | Перегрузка (overloading) | Переопределение (overriding) |
|---|---|---|
| Где | В одном классе (или в потомке) | Только в потомке |
| Параметры | **Разные** | **Те же** |
| Тип возврата | Любой | Тот же или подтип |
| Когда выбирается версия | При компиляции, по объявленным типам | При выполнении, по реальному классу объекта |
| \`@Override\` | Нельзя (ошибка) | Нужно ставить |

## protected и наследование

\`protected\` придуман как раз для наследования: «потомкам можно, остальным (вне пакета) нельзя». Но помните из урока про инкапсуляцию: \`protected\` открывает доступ ещё и всему пакету, а наследник из другого пакета может трогать \`protected\`-члены только через ссылку своего типа.

Хорошая практика — даже в иерархиях держать **поля \`private\`**, а потомкам давать \`protected\`-методы. \`protected\`-поле — это часть «публичного контракта» для всех будущих наследников: изменить его потом так же сложно, как \`public\`.

## final против наследования

- \`final class\` — от класса нельзя наследоваться (\`String\`, \`Integer\`, \`LocalDate\`). Это гарантия, что никто не подменит поведение.
- \`final\` метод — можно наследовать и вызывать, но нельзя переопределить. Полезно для методов, от которых зависит корректность класса (особенно если их вызывает конструктор).

## Типичные ошибки

- Наследование ради повторного использования кода без отношения is-a (\`Car extends Engine\`).
- Ожидание, что конструкторы унаследуются.
- Предок без конструктора без параметров → в потомке забыт явный \`super(...)\`.
- \`super(...)\` не первой строкой.
- Попытка обратиться к \`private\`-полю предка из потомка.
- Сужение доступа при переопределении (\`public\` → без модификатора).
- Перегрузка вместо переопределения из-за другого типа параметра (и отсутствие \`@Override\`).
- Вызов переопределяемого метода из конструктора предка.

## Шпаргалка

| Тема | Правило |
|---|---|
| Синтаксис | \`class Child extends Parent\` — один прямой предок |
| Корень иерархии | \`java.lang.Object\` |
| Не наследуются | конструкторы; \`private\` члены недоступны |
| Конструктор потомка | первой строкой \`super(...)\` или \`this(...)\`; иначе неявный \`super()\` |
| Порядок конструкторов | от самого дальнего предка к потомку |
| Переопределение | та же сигнатура, тип возврата — тот же/подтип, доступ не уже, checked-исключения не шире |
| Не переопределяются | \`final\`, \`static\` (скрываются), \`private\` методы, конструкторы |
| \`@Override\` | просит компилятор проверить, что метод действительно переопределяет |
| \`super.m()\` | вызов версии предка; \`super.super\` не бывает |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Для каких пар наследование `Потомок extends Предок` уместно (выполняется отношение is-a)?',
      options: [
        '`Dog extends Animal`',
        '`Manager extends Employee`',
        '`Student extends Person`',
        '`Car extends Engine`',
        '`Order extends Customer`',
      ],
      answer: ['`Dog extends Animal`', '`Manager extends Employee`', '`Student extends Person`'],
      explain: 'Собака — животное, менеджер — сотрудник, студент — человек. А машина не является двигателем, и заказ не является покупателем: это отношение «имеет» (has-a), его выражают полем (композицией), а не наследованием.',
    },
    {
      type: 'match',
      q: 'Соедините термин и его смысл',
      pairs: [
        ['Суперкласс', 'Класс-предок, от которого наследуются'],
        ['Подкласс', 'Класс-потомок, расширяющий предка'],
        ['`super(...)`', 'Вызов конструктора предка'],
        ['`super.m()`', 'Вызов версии метода m из предка'],
        ['`@Override`', 'Просьба к компилятору проверить, что метод переопределяет метод предка'],
        ['`Object`', 'Корень иерархии всех классов Java'],
      ],
    },
    {
      type: 'choice',
      q: 'Что из класса-предка подкласс **не может** использовать напрямую?',
      options: ['Конструкторы предка (они не наследуются)', '`private`-поля и методы предка', '`public`-методы предка', '`protected`-поля предка'],
      answer: ['Конструкторы предка (они не наследуются)', '`private`-поля и методы предка'],
      explain: 'Конструкторы не наследуются: их можно только вызвать через `super(...)`. `private`-поля физически есть в объекте потомка, но обратиться к ним можно только через методы предка.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nclass Swimmer { }\nclass Runner { }\n\nclass Triathlete extends Swimmer, Runner { }\n```',
      options: [
        'Нет: у класса может быть только один прямой суперкласс',
        'Да: Java поддерживает множественное наследование',
        'Да, если в классах нет методов с одинаковыми именами',
        'Нет: нужно писать `extends Swimmer extends Runner`',
      ],
      answer: 'Нет: у класса может быть только один прямой суперкласс',
      explain: 'Множественное наследование классов в Java запрещено (избегаем «ромбовидной проблемы»). Для нескольких «ролей» используют интерфейсы: `class Triathlete implements Swimmer, Runner`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass A {\n    A() {\n        System.out.print("A ");\n    }\n}\n\nclass B extends A {\n    B() {\n        System.out.print("B ");\n    }\n}\n\nclass C extends B {\n    C() {\n        System.out.print("C ");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        new C();\n    }\n}\n```',
      answer: ['A B C'],
      explain: 'Каждый конструктор начинается с неявного `super()`. `C()` вызывает `B()`, тот — `A()`. Первым **завершается** конструктор самого дальнего предка, поэтому вывод идёт от предка к потомку.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Base {\n    Base() {\n        System.out.print("Base() ");\n    }\n\n    Base(String s) {\n        System.out.print("Base(" + s + ") ");\n    }\n}\n\nclass Derived extends Base {\n    Derived() {\n        this("x");\n        System.out.print("Derived() ");\n    }\n\n    Derived(String s) {\n        System.out.print("Derived(" + s + ") ");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        new Derived();\n    }\n}\n```',
      answer: ['Base() Derived(x) Derived()'],
      hint: 'Какой конструктор предка вызовет `Derived(String s)`, если в нём нет явного `super(...)`?',
      explain: '`Derived()` делегирует `Derived("x")`. В нём нет явного `super(...)`, поэтому компилятор вставил `super()` — вызывается `Base()`, а не `Base(String)`: аргумент `s` сам в предка не передаётся. Порядок: `Base()`, `Derived(x)`, `Derived()`.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nclass Animal {\n    String name;\n\n    Animal(String name) {\n        this.name = name;\n    }\n}\n\nclass Cat extends Animal {\n}\n```',
      options: [
        'Нет: конструктор по умолчанию `Cat()` вызывает `super()`, а у `Animal` нет конструктора без параметров',
        'Да: `Cat` унаследует конструктор `Animal(String)`',
        'Да: у `Cat` нет полей, поэтому конструктор не нужен',
        'Нет: класс `Cat` пустой, а пустые классы запрещены',
      ],
      answer: 'Нет: конструктор по умолчанию `Cat()` вызывает `super()`, а у `Animal` нет конструктора без параметров',
      explain: 'Ошибка «constructor Animal in class Animal cannot be applied to given types». Конструкторы не наследуются. Исправление: `Cat(String name) { super(name); }` или добавить в `Animal` конструктор без параметров.',
    },
    {
      type: 'choice',
      q: 'Какие конструкторы класса `Manager` **не скомпилируются**? (`Employee` имеет конструкторы `Employee()` и `Employee(String name)`)\n```java\nclass Manager extends Employee {\n    int level;\n\n    // 1\n    Manager(String name) {\n        System.out.println("Создаём менеджера");\n        super(name);\n    }\n\n    // 2\n    Manager(int level) {\n        this();\n        super("Без имени");\n    }\n\n    // 3\n    Manager(String name, int level) {\n        super(name);\n        this.level = level;\n    }\n\n    // 4\n    Manager() {\n        level = 1;\n    }\n}\n```',
      options: ['1', '2', '3', '4'],
      answer: ['1', '2'],
      explain: '1 — `super(...)` не первой инструкцией (в Java 17 это запрещено). 2 — нельзя вызвать и `this(...)`, и `super(...)`: оба должны быть первыми. 3 — правильно. 4 — компилятор вставит `super()`, а `Employee()` существует, поэтому всё в порядке.',
    },
    {
      type: 'gaps',
      q: 'Допишите класс менеджера: он инициализирует родительскую часть, переопределяет расчёт зарплаты (оклад предка + премия) и `toString`',
      code: true,
      caseSensitive: true,
      text: 'class Employee {\n    private final String name;\n    private final double salary;\n\n    Employee(String name, double salary) {\n        this.name = name;\n        this.salary = salary;\n    }\n\n    double getSalary() {\n        return salary;\n    }\n\n    @Override\n    public String toString() {\n        return name + ": " + getSalary();\n    }\n}\n\nclass Manager [extends] Employee {\n    private final double bonus;\n\n    Manager(String name, double salary, double bonus) {\n        [super](name, salary);\n        this.bonus = bonus;\n    }\n\n    [@Override]\n    double getSalary() {\n        return [super].getSalary() + bonus;\n    }\n\n    @Override\n    [public] String toString() {\n        return "Менеджер " + super.toString();\n    }\n}',
      explain: '`super(name, salary)` — первой строкой, потому что поля предка `private`. `super.getSalary()` берёт оклад из версии предка. `toString` в `Object` — `public`, а сужать доступ при переопределении нельзя, поэтому `public` обязателен.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Employee {\n    private final String name;\n    private final double salary;\n\n    Employee(String name, double salary) {\n        this.name = name;\n        this.salary = salary;\n    }\n\n    double getSalary() {\n        return salary;\n    }\n\n    String describe() {\n        return name + " получает " + getSalary();\n    }\n}\n\nclass Manager extends Employee {\n    Manager(String name, double salary) {\n        super(name, salary);\n    }\n\n    @Override\n    double getSalary() {\n        return super.getSalary() * 2;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Employee e = new Manager("Борис", 100);\n        System.out.println(e.describe());\n    }\n}\n```',
      answer: ['Борис получает 200.0'],
      explain: '`describe()` объявлен в `Employee`, но вызывает `getSalary()` у **реального** объекта — а это `Manager`, поэтому работает переопределённая версия: 100 · 2 = 200.0. Тип переменной `Employee` здесь ничего не меняет.',
    },
    {
      type: 'choice',
      q: 'В классе `Animal` есть метод `public void speak()`. Что будет, если в потомке написать так?\n```java\nclass Dog extends Animal {\n    @Override\n    void speak() {\n        System.out.println("Гав");\n    }\n}\n```',
      options: [
        'Ошибка компиляции: нельзя сужать доступ при переопределении (public → package-private)',
        'Скомпилируется: модификатор доступа при переопределении не важен',
        'Скомпилируется, но метод станет перегрузкой, а не переопределением',
        'Ошибка компиляции: `@Override` нельзя ставить на методы без `public`',
      ],
      answer: 'Ошибка компиляции: нельзя сужать доступ при переопределении (public → package-private)',
      explain: 'Ошибка «attempting to assign weaker access privileges; was public». Объект `Dog` должен подходить везде, где ожидают `Animal`, — значит, его `speak()` должен быть доступен как минимум так же широко.',
    },
    {
      type: 'choice',
      q: 'В классе `Shelter` объявлен метод `Animal adopt() { ... }` (package-private), `Dog extends Animal`. Какие переопределения в `class DogShelter extends Shelter` **скомпилируются**?',
      options: [
        '`Dog adopt() { return new Dog(); }`',
        '`public Animal adopt() { return new Animal(); }`',
        '`Object adopt() { return new Dog(); }`',
        '`private Dog adopt() { return new Dog(); }`',
      ],
      answer: ['`Dog adopt() { return new Dog(); }`', '`public Animal adopt() { return new Animal(); }`'],
      explain: 'Ковариантный возврат: можно вернуть подтип (`Dog`), но не более общий тип (`Object`). Доступ можно расширить (`public`), но не сузить (`private`).',
    },
    {
      type: 'choice',
      q: 'В предке объявлен метод `void read() throws IOException`. Какие переопределения в потомке **скомпилируются**? (`FileNotFoundException` — подкласс `IOException`; `RuntimeException` — unchecked)',
      options: [
        '`void read() { }`',
        '`void read() throws FileNotFoundException { }`',
        '`void read() throws RuntimeException { }`',
        '`void read() throws Exception { }`',
      ],
      answer: ['`void read() { }`', '`void read() throws FileNotFoundException { }`', '`void read() throws RuntimeException { }`'],
      explain: 'Переопределённый метод не может бросать новые или более общие **checked**-исключения (`Exception` шире `IOException` — ошибка). Меньше, уже или вообще без исключений — можно. Unchecked-исключения на правило не влияют.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nclass Point {\n    int x, y;\n\n    @Override\n    public boolean equals(Point other) {\n        return other != null && x == other.x && y == other.y;\n    }\n}\n```',
      options: [
        'Ошибка компиляции: method does not override or implement a method from a supertype',
        'Скомпилируется: equals переопределён',
        'Скомпилируется, но `@Override` будет проигнорирована',
        'Ошибка при запуске программы',
      ],
      answer: 'Ошибка компиляции: method does not override or implement a method from a supertype',
      explain: 'В `Object` метод объявлен как `equals(Object obj)`. `equals(Point)` — другой параметр, значит это **перегрузка**. Без `@Override` код бы скомпилировался, но `HashSet` и `List.contains` вызывали бы старый `equals(Object)`. Аннотация превратила тихий баг в ошибку компиляции.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nclass Animal {\n    void speak(Object o) {\n        System.out.println("Animal");\n    }\n}\n\nclass Dog extends Animal {\n    void speak(String s) {\n        System.out.println("Dog");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Animal a = new Dog();\n        a.speak("гав");\n    }\n}\n```',
      answer: ['Animal'],
      hint: 'Это переопределение или перегрузка?',
      explain: '`speak(String)` не переопределяет `speak(Object)` — параметры разные, это перегрузка. Переменная имеет тип `Animal`, а у `Animal` есть только `speak(Object)`; переопределения в `Dog` нет — работает версия `Animal`. Будь у метода в `Dog` аннотация `@Override`, ошибку нашёл бы компилятор.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\nclass Parent {\n    private void hello() {\n        System.out.println("Parent.hello");\n    }\n\n    void greet() {\n        hello();\n    }\n}\n\nclass Child extends Parent {\n    public void hello() {\n        System.out.println("Child.hello");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        new Child().greet();\n    }\n}\n```',
      options: ['`Parent.hello`', '`Child.hello`', 'Ошибка компиляции: нельзя расширить доступ private → public', 'Ошибка компиляции: метод hello уже определён'],
      answer: '`Parent.hello`',
      explain: '`private`-методы не наследуются и не переопределяются. `Child.hello()` — независимый новый метод. Внутри `Parent.greet()` вызов `hello()` привязан к приватному методу `Parent` при компиляции.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\nclass Parent {\n    static void info() {\n        System.out.println("Parent.info");\n    }\n}\n\nclass Child extends Parent {\n    static void info() {\n        System.out.println("Child.info");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Parent p = new Child();\n        p.info();\n    }\n}\n```',
      options: ['`Parent.info`', '`Child.info`', 'Ошибка компиляции', 'NullPointerException'],
      answer: '`Parent.info`',
      explain: 'Статические методы не переопределяются, а **скрываются** (hiding). Вызов статического метода выбирается по объявленному типу переменной (`Parent`), а не по реальному объекту. Поэтому `@Override` на статическом методе — ошибка.',
    },
    {
      type: 'choice',
      q: 'Какие методы **нельзя** переопределить в потомке?',
      options: ['`final`-методы', '`static`-методы', '`private`-методы', 'Конструкторы', '`protected`-методы', '`public`-методы'],
      answer: ['`final`-методы', '`static`-методы', '`private`-методы', 'Конструкторы'],
      explain: '`final` запрещает переопределение явно; `static` можно лишь скрыть; `private` и конструкторы вообще не наследуются.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (через пробел)\n```java\nclass Base {\n    Base() {\n        show();\n    }\n\n    void show() {\n        System.out.print("Base ");\n    }\n}\n\nclass Derived extends Base {\n    int x = 5;\n    String s = "hi";\n\n    @Override\n    void show() {\n        System.out.print(x + " " + s + " ");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Derived d = new Derived();\n        d.show();\n    }\n}\n```',
      answer: ['0 null 5 hi'],
      hint: 'Когда инициализируются поля потомка — до или после конструктора предка?',
      explain: 'Конструктор `Base` работает **до** инициализации полей `Derived`, но вызывает уже переопределённый `show()`. Поля потомка в этот момент имеют значения по умолчанию: `0` и `null`. Второй вызов — после полной инициализации: `5 hi`. Мораль: не вызывайте переопределяемые методы из конструктора.',
    },
    {
      type: 'choice',
      q: 'Какие методы есть у **любого** объекта Java, даже если класс объявлен как `class Empty { }`?',
      options: ['`toString()`', '`equals(Object)`', '`hashCode()`', '`getClass()`', '`compareTo(Object)`', '`length()`'],
      answer: ['`toString()`', '`equals(Object)`', '`hashCode()`', '`getClass()`'],
      explain: 'Класс без `extends` неявно наследует `java.lang.Object`, а с ним — `toString`, `equals`, `hashCode`, `getClass` и др. `compareTo` появляется только при реализации интерфейса `Comparable`.',
    },
    {
      type: 'choice',
      q: '`class A { void m() }`, `class B extends A` переопределяет `m()`, `class C extends B` тоже переопределяет `m()`. Как из `C` вызвать версию `m()` класса `A`?',
      options: [
        'Напрямую никак: `super.super.m()` в Java не существует',
        '`super.super.m();`',
        '`A.super.m();`',
        '`((A) this).m();`',
      ],
      answer: 'Напрямую никак: `super.super.m()` в Java не существует',
      explain: '`super` — только ближайший предок. `super.super.m()` — синтаксическая ошибка. Приведение `((A) this).m()` не поможет: вызов всё равно пойдёт к версии реального класса (C) — это динамическое связывание. `A.super.m()` — синтаксис для default-методов интерфейсов, к классам не относится.',
    },
    {
      type: 'order',
      q: 'Расставьте строки так, чтобы получился корректный подкласс (у `Employee` есть только конструктор `Employee(String name, double salary)`)',
      items: [
        'class Manager extends Employee {',
        '    private final double bonus;',
        '    Manager(String name, double salary, double bonus) {',
        '        super(name, salary);',
        '        this.bonus = bonus;',
        '    }',
        '}',
      ],
      join: '\n',
      explain: 'Вызов `super(...)` обязан быть первой инструкцией конструктора — до присваивания собственных полей.',
    },
    {
      type: 'flashcard',
      front: 'Правила переопределения метода (overriding)',
      back: '1) Та же сигнатура (имя + типы параметров).\n2) Тип возврата — тот же или подтип (для примитивов — тот же).\n3) Доступ — не уже, чем у предка.\n4) Checked-исключения — не новые и не шире.\n5) Нельзя переопределить `final`, `static` (скрывается), `private`.\nСтавьте `@Override`.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Чем перегрузка отличается от переопределения?',
      back: '**Перегрузка** — методы с одинаковым именем, но **разными параметрами**; версия выбирается **при компиляции** по объявленным типам аргументов.\n**Переопределение** — потомок заменяет метод предка с **той же сигнатурой**; версия выбирается **при выполнении** по реальному классу объекта.',
    },
    {
      type: 'flashcard',
      front: 'Что делает компилятор, если в конструкторе потомка нет ни `this(...)`, ни `super(...)`?',
      back: 'Вставляет первой строкой неявный **`super();`** — вызов конструктора предка без параметров. Если у предка такого конструктора нет — ошибка компиляции, нужно явно вызвать `super(аргументы)`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Создайте класс `Person` (поля `name`, `age` — `private`, конструктор, геттеры, `toString()` вида `Аня, 19 лет`) и его наследника `Student` с дополнительным полем `group`.\n- Конструктор `Student` должен вызывать `super(...)`.\n- Переопределите `toString()` так, чтобы он **дополнял** версию предка: `Аня, 19 лет, группа ИВТ-11`.\n- Используйте `@Override`.',
      starter: `class Person {

}

class Student extends Person {

}

public class Main {
    public static void main(String[] args) {
        Person p = new Person("Олег", 45);
        Student s = new Student("Аня", 19, "ИВТ-11");
        System.out.println(p); // Олег, 45 лет
        System.out.println(s); // Аня, 19 лет, группа ИВТ-11
    }
}`,
      solution: `class Person {
    private final String name;
    private final int age;

    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    @Override
    public String toString() {
        return name + ", " + age + " лет";
    }
}

class Student extends Person {
    private final String group;

    Student(String name, int age, String group) {
        super(name, age);
        this.group = group;
    }

    public String getGroup() {
        return group;
    }

    @Override
    public String toString() {
        return super.toString() + ", группа " + group;
    }
}

public class Main {
    public static void main(String[] args) {
        Person p = new Person("Олег", 45);
        Student s = new Student("Аня", 19, "ИВТ-11");
        System.out.println(p); // Олег, 45 лет
        System.out.println(s); // Аня, 19 лет, группа ИВТ-11
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Есть класс `BankAccount` с методами `deposit`, `withdraw` (возвращает `boolean`) и `getBalance`. Напишите наследника `SavingsAccount` (сберегательный счёт):\n- поле `rate` (годовая ставка, например 0.1);\n- метод `addInterest()` — начисляет проценты на остаток через `deposit`;\n- **переопределите** `withdraw`: снимать можно, только если на счёте останется не меньше `MIN_BALANCE = 1000`; саму операцию выполняйте через `super.withdraw(...)`.',
      starter: `class BankAccount {
    private double balance;

    BankAccount(double initial) {
        balance = initial;
    }

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > balance) {
            return false;
        }
        balance -= amount;
        return true;
    }
}

class SavingsAccount extends BankAccount {

}`,
      solution: `class BankAccount {
    private double balance;

    BankAccount(double initial) {
        balance = initial;
    }

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }

    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > balance) {
            return false;
        }
        balance -= amount;
        return true;
    }
}

class SavingsAccount extends BankAccount {
    public static final double MIN_BALANCE = 1000;
    private final double rate;

    SavingsAccount(double initial, double rate) {
        super(initial);
        this.rate = rate;
    }

    public void addInterest() {
        deposit(getBalance() * rate);
    }

    @Override
    public boolean withdraw(double amount) {
        if (getBalance() - amount < MIN_BALANCE) {
            return false;
        }
        return super.withdraw(amount);
    }
}

public class Main {
    public static void main(String[] args) {
        SavingsAccount s = new SavingsAccount(5000, 0.1);
        s.addInterest();
        System.out.println(s.getBalance());     // 5500.0
        System.out.println(s.withdraw(4600));   // false — осталось бы 900
        System.out.println(s.withdraw(4500));   // true
        System.out.println(s.getBalance());     // 1000.0

        BankAccount acc = s;                    // переменная типа предка
        System.out.println(acc.withdraw(1));    // false — работает версия SavingsAccount
    }
}`,
      explain: 'Поле `balance` у предка `private`, поэтому потомок работает с ним только через `getBalance`, `deposit` и `super.withdraw`. Последняя строка показывает главное: даже через ссылку типа `BankAccount` вызывается переопределённый `withdraw`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Смоделируйте зарплатную ведомость:\n- `Employee` (имя, оклад, метод `double monthlyPay()` = оклад, `toString()`);\n- `Manager extends Employee` — к окладу добавляется премия;\n- `Intern extends Employee` — получает 60% оклада.\n\nВ `main` создайте массив `Employee[]` из сотрудников разных типов и посчитайте общий фонд оплаты труда одним циклом, не проверяя типы объектов.',
      solution: `class Employee {
    private final String name;
    private final double salary;

    Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    public String getName() {
        return name;
    }

    public double getSalary() {
        return salary;
    }

    public double monthlyPay() {
        return salary;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + " " + name + ": " + monthlyPay();
    }
}

class Manager extends Employee {
    private final double bonus;

    Manager(String name, double salary, double bonus) {
        super(name, salary);
        this.bonus = bonus;
    }

    @Override
    public double monthlyPay() {
        return super.monthlyPay() + bonus;
    }
}

class Intern extends Employee {
    Intern(String name, double salary) {
        super(name, salary);
    }

    @Override
    public double monthlyPay() {
        return getSalary() * 0.6;
    }
}

public class Main {
    public static void main(String[] args) {
        Employee[] staff = {
            new Employee("Аня", 1000),
            new Manager("Борис", 2000, 500),
            new Intern("Вера", 1000),
        };
        double total = 0;
        for (Employee e : staff) {
            System.out.println(e);
            total += e.monthlyPay();
        }
        System.out.println("Итого: " + total);
        // Employee Аня: 1000.0
        // Manager Борис: 2500.0
        // Intern Вера: 600.0
        // Итого: 4100.0
    }
}`,
      explain: 'Цикл ничего не знает о конкретных типах: каждый объект сам выбирает свою версию `monthlyPay()`. Добавить новый тип сотрудника можно, не трогая цикл, — в этом сила наследования вместе с переопределением.',
    },
  ],
});
