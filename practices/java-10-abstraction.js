Trainer.add({
  id: 'java-10-abstraction',
  title: 'Java 10. Абстракция: абстрактные классы и интерфейсы',
  subject: 'Java',
  description: 'Абстрактные классы и шаблонный метод, интерфейсы как контракт, default/static/private-методы, конфликт default-методов, функциональные интерфейсы, sealed-типы и выбор между абстрактным классом и интерфейсом.',
  lesson: `## Абстракция: что это и зачем

**Абстракция** — это выделение существенного и отбрасывание деталей. Мы описываем, *что* объект умеет делать, и не раскрываем, *как* он это делает.

Аналогия: розетка. Любой прибор с подходящей вилкой работает от любой розетки — чайнику всё равно, откуда берётся ток: ГЭС, АЭС или солнечная панель. Розетка — это абстракция «источник электричества» с простым договором (220 В, такая-то форма вилки). Пока договор соблюдается, обе стороны можно менять независимо.

В коде то же самое: метод \`printReport(Shape s)\` знает лишь, что у фигуры есть площадь, а как она считается — его не касается.

> 💡 **Абстракция vs инкапсуляция.** Абстракция отвечает на вопрос «*какой* внешний вид (контракт) показать миру», инкапсуляция — «*как спрятать* реализацию и защитить состояние». Они дополняют друг друга: абстракция проектирует интерфейс, инкапсуляция прячет всё остальное.

В Java для абстракции есть два инструмента: **абстрактные классы** и **интерфейсы**.

## Проблема: «пустой» метод в базовом классе

В уроке 9 мы писали так:

\`\`\`java
class Shape {
    double area() { return 0; }   // какая площадь у «фигуры вообще»? Бессмыслица
}
\`\`\`

Тут сразу три проблемы: \`new Shape()\` создаёт бессмысленный объект; ноль — неправда; а если автор нового подкласса забудет переопределить \`area()\`, программа молча будет считать площадь нулевой. Хочется сказать компилятору: «у каждой фигуры *обязана* быть площадь, но общей формулы нет».

## Абстрактные классы

\`\`\`java
abstract class Shape {
    private final String name;              // у абстрактного класса может быть состояние

    protected Shape(String name) {          // ...и конструктор (его вызывают потомки)
        this.name = name;
    }

    abstract double area();                 // абстрактный метод: без тела, с точкой с запятой

    String describe() {                     // обычный метод с реализацией
        return name + ", площадь " + area();
    }
}

class Rectangle extends Shape {
    private final double w, h;
    Rectangle(double w, double h) {
        super("Прямоугольник");
        this.w = w;
        this.h = h;
    }
    @Override
    double area() { return w * h; }
}

Shape s = new Rectangle(2, 3);
System.out.println(s.describe()); // выведет: Прямоугольник, площадь 6.0
// Shape bad = new Shape("?");    // ошибка: Shape is abstract; cannot be instantiated
\`\`\`

Правила:
- Создать объект абстрактного класса через \`new\` **нельзя**. Но переменные этого типа объявлять можно и нужно.
- Абстрактный метод не имеет тела: \`abstract double area();\`.
- Если в классе есть хотя бы один абстрактный метод, класс **обязан** быть \`abstract\`.
- Абстрактный класс может иметь поля, конструкторы, обычные и \`static\`-методы — всё, что есть у обычного класса.
- Абстрактный класс может вообще не иметь абстрактных методов — так запрещают создавать «заготовку» напрямую.
- Неабстрактный потомок обязан реализовать **все** абстрактные методы. Иначе — ошибка: *Circle is not abstract and does not override abstract method area() in Shape*. Абстрактный потомок может оставить часть методов нереализованными.

> ⚠️ **Подвох.** Недопустимые сочетания модификаторов: \`abstract final\` (абстрактное требует переопределения, final его запрещает), \`abstract private\` (потомок не увидит метод и не сможет реализовать), \`abstract static\` (static-методы не переопределяются). Всё это — ошибки компиляции. А \`abstract void f() { }\` — тоже ошибка: у абстрактного метода не может быть тела.

> 💡 **Зачем конструктор, если объект создать нельзя?** Объект создаётся у потомка, но его «родительская часть» (поле \`name\`) должна быть инициализирована. Конструктор абстрактного класса вызывается через \`super(...)\` из конструктора потомка. Его часто делают \`protected\`.

## Шаблонный метод (Template Method)

Самое известное применение абстрактных классов. Алгоритм в целом одинаков, но отдельные шаги различаются. Общий алгоритм пишем один раз в базовом классе (метод делаем \`final\`, чтобы его не сломали), а изменяющиеся шаги объявляем абстрактными.

\`\`\`java
abstract class Beverage {
    // шаблонный метод: порядок шагов фиксирован
    public final void prepare() {
        boilWater();
        brew();
        pourInCup();
        if (wantsCondiments()) {
            addCondiments();
        }
    }

    private void boilWater() { System.out.println("Кипятим воду"); }
    private void pourInCup() { System.out.println("Наливаем в чашку"); }

    protected abstract void brew();           // обязательный шаг для потомков
    protected abstract void addCondiments();

    protected boolean wantsCondiments() {     // «крючок» (hook): можно переопределить, но не обязательно
        return true;
    }
}

class Tea extends Beverage {
    @Override protected void brew() { System.out.println("Завариваем чай"); }
    @Override protected void addCondiments() { System.out.println("Добавляем лимон"); }
}

class Coffee extends Beverage {
    @Override protected void brew() { System.out.println("Варим кофе"); }
    @Override protected void addCondiments() { System.out.println("Добавляем молоко"); }
    @Override protected boolean wantsCondiments() { return false; }  // чёрный кофе
}

new Tea().prepare();
// выведет:
// Кипятим воду
// Завариваем чай
// Наливаем в чашку
// Добавляем лимон
\`\`\`

Базовый класс сам вызывает методы потомков, а не наоборот («не звоните нам — мы сами вам позвоним»). Дублирования нет: кипячение и разлив написаны один раз. В JDK так устроены, например, \`AbstractList\` и \`InputStream\`.

## Интерфейсы: контракт

**Интерфейс** — это чистый контракт: список того, что класс *обязуется уметь*. Аналогия — должностная инструкция «водитель»: в ней перечислено, что должен уметь сотрудник, но не сказано, кто он и как научился. Её может выполнять и студент, и пенсионер.

\`\`\`java
interface Flyable {
    void fly();                       // неявно public abstract
}
interface Swimmable {
    int MAX_DEPTH = 10;               // неявно public static final — константа
    void swim();
}

class Duck implements Flyable, Swimmable {      // можно реализовать несколько интерфейсов
    @Override public void fly()  { System.out.println("Утка летит"); }
    @Override public void swim() { System.out.println("Утка плывёт, глубина до " + MAX_DEPTH); }
}

class Plane implements Flyable {                // никак не связан с уткой
    @Override public void fly() { System.out.println("Самолёт летит"); }
}

Flyable[] flyers = { new Duck(), new Plane() };
for (Flyable f : flyers) {
    f.fly();
}
// выведет:
// Утка летит
// Самолёт летит
\`\`\`

Главное отличие от наследования классов: интерфейс описывает **способность** («умеет летать»), а не родство («является птицей»). Утку и самолёт ничто не роднит, но оба умеют летать — и код, работающий с \`Flyable\`, обслуживает обоих.

Что неявно добавляет компилятор:
- методы без тела — \`public abstract\`;
- поля — \`public static final\` (то есть это **константы**; изменить их нельзя, объектного состояния у интерфейса нет);
- конструкторов у интерфейса нет и быть не может.

> ⚠️ **Подвох.** Метод интерфейса неявно \`public\`, поэтому реализация в классе **обязана** быть \`public\`. Если написать \`void fly() { }\` без \`public\`, получится ошибка *attempting to assign weaker access privileges; was public* — сужать доступ при переопределении нельзя.

Класс может одновременно наследовать один класс и реализовывать сколько угодно интерфейсов: \`class Duck extends Bird implements Flyable, Swimmable\`. Сначала \`extends\`, потом \`implements\`.

## default, static и private методы в интерфейсах

**default-методы** (Java 8) имеют реализацию прямо в интерфейсе. Зачем: чтобы *добавлять* методы в уже существующие интерфейсы, не ломая тысячи классов, которые их реализуют. Так в Java 8 в \`Iterable\` появился \`forEach\`, а в \`List\` — \`sort\`.

\`\`\`java
interface Greeter {
    String name();                                  // абстрактный

    default String greet() {                        // реализация по умолчанию
        return "Привет, " + decorate(name()) + "!";
    }

    private String decorate(String s) {             // private (Java 9): помощник для default-методов
        return s.toUpperCase();
    }

    static Greeter of(String name) {                // static: фабрика, вызывается через имя интерфейса
        return () -> name;                          // лямбда — см. ниже
    }
}

Greeter g = Greeter.of("Аня");
System.out.println(g.greet()); // выведет: Привет, АНЯ!
\`\`\`

- **default** — наследуется реализующими классами, может быть переопределён.
- **static** — принадлежит интерфейсу, вызывается **только** как \`Greeter.of(...)\`. Через класс-реализацию или объект вызвать нельзя (в отличие от static-методов классов) — ошибка компиляции.
- **private** — вспомогательный код для default-методов, снаружи не виден.

## Конфликт default-методов

Если класс получает один и тот же default-метод из двух интерфейсов — компилятор не угадывает:

\`\`\`java
interface Walker  { default String move() { return "иду"; } }
interface Swimmer { default String move() { return "плыву"; } }

class Frog implements Walker, Swimmer {
    @Override
    public String move() {                           // без этого переопределения — ошибка компиляции
        return Walker.super.move() + " и " + Swimmer.super.move();
    }
}

System.out.println(new Frog().move()); // выведет: иду и плыву
\`\`\`

Без переопределения будет ошибка *types Walker and Swimmer are incompatible; class Frog inherits unrelated defaults for move()*. Синтаксис \`Интерфейс.super.метод()\` вызывает default-реализацию конкретного интерфейса (только непосредственного родителя).

Три правила разрешения конфликтов:
1. **Класс побеждает.** Метод, объявленный в классе или унаследованный от суперкласса, важнее любого default-метода.
2. **Более конкретный интерфейс побеждает.** Если \`B extends A\` и оба определяют default \`hi()\`, берётся версия \`B\`.
3. **Иначе** — ошибка компиляции, класс обязан переопределить метод сам.

\`\`\`java
interface Greeting { default String hi() { return "interface"; } }
class Base { public String hi() { return "class"; } }
class Child extends Base implements Greeting { }

System.out.println(new Child().hi()); // выведет: class
\`\`\`

## Наследование интерфейсов

Интерфейс может расширять **несколько** интерфейсов: \`interface Amphibian extends Walker, Swimmer\`. Множественное наследование *типов* в Java есть, множественного наследования *классов* (и их состояния) — нет. Абстрактный класс, реализующий интерфейс, может не реализовывать его методы — это сделают его неабстрактные потомки.

## Функциональные интерфейсы и лямбды (кратко)

Интерфейс ровно с **одним абстрактным методом** называется **функциональным**. Default-, static-, private-методы и методы класса \`Object\` (например, \`equals\`) не считаются. Аннотация \`@FunctionalInterface\` просит компилятор проверить это.

Объект функционального интерфейса можно создать **лямбда-выражением** — по сути, телом того самого единственного метода:

\`\`\`java
@FunctionalInterface
interface Operation {
    int apply(int a, int b);
}

Operation plus = (a, b) -> a + b;
Operation max = (a, b) -> {
    if (a > b) return a;
    return b;
};
System.out.println(plus.apply(2, 3) + " " + max.apply(2, 3)); // выведет: 5 3
\`\`\`

Готовые функциональные интерфейсы JDK: \`Runnable\` (\`() -> void\`), \`Comparator<T>\`, \`Predicate<T>\` (\`T -> boolean\`), \`Function<T, R>\`, \`Consumer<T>\`, \`Supplier<T>\`. Подробнее о лямбдах и их связи с анонимными классами — в уроке 12.

## sealed: закрытая иерархия (Java 17)

Иногда набор вариантов известен заранее и не должен расширяться: способ доставки — курьер или самовывоз, и всё. \`sealed\` (запечатанный) класс или интерфейс сам перечисляет, кто может его наследовать:

\`\`\`java
sealed interface Delivery permits Courier, Pickup { }

record Courier(String address) implements Delivery { }   // record неявно final
final class Pickup implements Delivery { }

// class Drone implements Delivery { }  // ошибка: Drone нет в списке permits
\`\`\`

Каждый разрешённый потомок обязан явно выбрать одно из трёх:
- \`final\` — дальше наследовать нельзя;
- \`sealed\` — продолжает закрытую иерархию со своим \`permits\`;
- \`non-sealed\` — снова открыт для любого наследования.

Если все потомки описаны в том же файле, \`permits\` можно не писать. Разрешённые потомки должны находиться в том же пакете (или модуле). Польза: читатель и компилятор видят *полный* список вариантов.

## Абстрактный класс или интерфейс?

| | Абстрактный класс | Интерфейс |
|---|---|---|
| Сколько можно унаследовать | один (\`extends\`) | сколько угодно (\`implements\`) |
| Поля | любые, в т.ч. изменяемое состояние | только константы \`public static final\` |
| Конструктор | есть | нет |
| Модификаторы методов | любые | \`public\` (abstract, default, static) и \`private\` |
| Смысл | «является»: общая основа родственных классов | «умеет»: способность, даже у неродственных классов |
| Создать через \`new\` | нельзя | нельзя |

Как выбирать:
- **Интерфейс — по умолчанию**, когда описываете тип или способность: \`Comparable\`, \`Payable\`, \`Exportable\`. Он не отнимает у класса единственную возможность \`extends\`.
- **Абстрактный класс** — когда у близкородственных классов есть общее *состояние* и *код*: поля, конструктор, шаблонный метод.
- Часто их комбинируют: интерфейс задаёт тип (\`List\`), а абстрактный класс даёт частичную реализацию (\`AbstractList\`).

## Шпаргалка

- \`abstract class\` — нельзя \`new\`; может иметь поля, конструкторы, обычные методы; потомок реализует все абстрактные методы или сам становится абстрактным.
- Нельзя: \`abstract\` + \`final\` / \`private\` / \`static\`; абстрактный метод с телом.
- Интерфейс: методы неявно \`public abstract\`, поля — \`public static final\`, конструкторов нет; реализация метода в классе — обязательно \`public\`.
- default — реализация по умолчанию; static — только через имя интерфейса; private — помощник.
- Конфликт default-методов: класс побеждает → более конкретный интерфейс побеждает → иначе переопределить и выбрать через \`Интерфейс.super.метод()\`.
- Функциональный интерфейс — один абстрактный метод; его объект можно задать лямбдой.
- \`sealed ... permits ...\`; потомки — \`final\`, \`sealed\` или \`non-sealed\`.`,
  tasks: [
    {
      type: 'choice',
      q: 'Что такое **абстракция** как принцип ООП?',
      options: [
        'Выделение существенного: описываем, что объект умеет делать, скрывая детали того, как он это делает',
        'Запрет прямого доступа к полям объекта с помощью модификатора private',
        'Возможность создавать новые классы на основе существующих',
        'Возможность вызывать метод с одним именем для объектов разных классов',
      ],
      answer: 'Выделение существенного: описываем, что объект умеет делать, скрывая детали того, как он это делает',
      explain: 'Второй вариант — инкапсуляция, третий — наследование, четвёртый — полиморфизм. Абстракция проектирует «внешний вид» (контракт), а инкапсуляция прячет реализацию.',
    },
    {
      type: 'choice',
      q: `Что произойдёт?
\`\`\`java
abstract class Shape {
    abstract double area();
}
public class Main {
    public static void main(String[] args) {
        Shape s = new Shape();
        System.out.println(s.area());
    }
}
\`\`\``,
      options: [
        'Ошибка компиляции: нельзя создать объект абстрактного класса',
        'Выведет `0.0`',
        'Ошибка при выполнении: `AbstractMethodError`',
        'Ошибка компиляции: нельзя объявить переменную абстрактного типа',
      ],
      answer: 'Ошибка компиляции: нельзя создать объект абстрактного класса',
      explain: '*Shape is abstract; cannot be instantiated.* При этом объявить переменную типа `Shape` можно: `Shape s = new Circle(1);` — это нормальная практика.',
    },
    {
      type: 'choice',
      q: 'Что **может** быть у абстрактного класса? Выберите все.',
      options: [
        'Конструктор',
        'Изменяемые поля (состояние объекта)',
        'Методы с реализацией',
        'Ни одного абстрактного метода',
        'Абстрактный метод с телом `{ }`',
        'Модификатор `final` у самого класса',
      ],
      answer: ['Конструктор', 'Изменяемые поля (состояние объекта)', 'Методы с реализацией', 'Ни одного абстрактного метода'],
      explain: 'Абстрактный класс — это обычный класс, который запрещено создавать через `new` и который может содержать абстрактные методы. У абстрактного метода тела нет. `abstract final class` — противоречие: абстрактный класс существует ради наследования, а `final` его запрещает.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
abstract class Shape {
    abstract double area();
    abstract double perimeter();
}
class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
}
\`\`\``,
      options: [
        'Да, `perimeter()` в `Circle` просто вернёт `0`',
        'Нет: `Circle` не реализует `perimeter()` и не объявлен `abstract`',
        'Нет: у абстрактного класса должен быть конструктор',
        'Да, но вызов `perimeter()` бросит исключение',
      ],
      answer: 'Нет: `Circle` не реализует `perimeter()` и не объявлен `abstract`',
      explain: '*Circle is not abstract and does not override abstract method perimeter() in Shape.* Неабстрактный потомок обязан реализовать все абстрактные методы — в этом и смысл: компилятор не даст «забыть» обязательный метод.',
    },
    {
      type: 'choice',
      q: 'Какие объявления методов **допустимы** внутри `abstract class M`? Выберите все.',
      options: [
        '`abstract void a();`',
        '`protected abstract int b();`',
        '`private abstract void c();`',
        '`abstract static void d();`',
        '`abstract final void e();`',
        '`abstract void f() { }`',
      ],
      answer: ['`abstract void a();`', '`protected abstract int b();`'],
      explain: '`abstract` + `private` — потомок не увидит метод и не сможет реализовать. `abstract` + `static` — static-методы не переопределяются. `abstract` + `final` — final запрещает переопределение. У абстрактного метода не может быть тела. Всё это — ошибки компиляции (*illegal combination of modifiers* / *abstract methods cannot have a body*).',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите строки через пробел.
\`\`\`java
abstract class Beverage {
    public final void prepare() {
        boil();
        brew();
        if (wantsSugar()) {
            System.out.println("сахар");
        }
    }
    private void boil() { System.out.println("вода"); }
    protected abstract void brew();
    protected boolean wantsSugar() { return true; }
}
class Coffee extends Beverage {
    @Override protected void brew() { System.out.println("кофе"); }
    @Override protected boolean wantsSugar() { return false; }
}
public class Main {
    public static void main(String[] args) {
        new Coffee().prepare();
    }
}
\`\`\``,
      answer: ['вода кофе'],
      explain: 'Шаблонный метод `prepare()` задаёт порядок шагов. `brew()` реализован в `Coffee`, а «крючок» `wantsSugar()` переопределён и возвращает `false` — поэтому шаг с сахаром пропущен.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
abstract class Vehicle {
    protected final String name;
    Vehicle(String name) {
        this.name = name;
        System.out.print("V ");
    }
    abstract int wheels();
    String info() { return name + ":" + wheels(); }
}
class Bike extends Vehicle {
    Bike() {
        super("bike");
        System.out.print("B ");
    }
    @Override int wheels() { return 2; }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(new Bike().info());
    }
}
\`\`\``,
      answer: ['V B bike:2'],
      explain: 'Конструктор абстрактного класса существует и вызывается через `super(...)` первым. Затем тело конструктора `Bike`. `info()` из `Vehicle` вызывает абстрактный `wheels()` — работает реализация `Bike`.',
    },
    {
      type: 'choice',
      q: 'В интерфейсе написано `int LIMIT = 5;`. Какие модификаторы у этого поля на самом деле?',
      options: ['`public static final`', '`private`', '`public` (обычное поле экземпляра)', '`protected static`'],
      answer: '`public static final`',
      explain: 'Все поля интерфейса неявно `public static final` — это константы. Состояния объекта у интерфейса нет; присвоить `LIMIT = 6` нельзя (*cannot assign a value to static final variable*).',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
interface Runner {
    void run();
}
class Sprinter implements Runner {
    void run() {
        System.out.println("бегу");
    }
}
\`\`\``,
      options: [
        'Да',
        'Нет: метод `run()` в `Sprinter` должен быть `public`',
        'Нет: в интерфейсе метод должен быть помечен `abstract`',
        'Нет: не хватает аннотации `@Override`',
      ],
      answer: 'Нет: метод `run()` в `Sprinter` должен быть `public`',
      explain: 'Методы интерфейса неявно `public`. Реализация без модификатора — package-private, то есть доступ сужается, а это запрещено: *attempting to assign weaker access privileges; was public*. `@Override` желателен, но не обязателен.',
    },
    {
      type: 'match',
      q: 'Соедините объявление в интерфейсе и его смысл',
      pairs: [
        ['`void run();`', 'Неявно public abstract — обязан реализовать каждый класс'],
        ['`default void log() { ... }`', 'Реализация по умолчанию, которую класс может переопределить'],
        ['`static Shape unit() { ... }`', 'Вызывается только через имя интерфейса'],
        ['`private String fmt() { ... }`', 'Вспомогательный код для default-методов, снаружи не виден'],
        ['`int LIMIT = 5;`', 'Константа: неявно public static final'],
      ],
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
interface Walker  { default String move() { return "иду"; } }
interface Swimmer { default String move() { return "плыву"; } }

class Duck implements Walker, Swimmer { }
\`\`\``,
      options: [
        'Да, `move()` вернёт `иду` — побеждает первый интерфейс в списке',
        'Да, `move()` вернёт `плыву` — побеждает последний интерфейс в списке',
        'Нет: класс унаследовал два несвязанных default-метода и обязан переопределить `move()`',
        'Нет: класс не может реализовать два интерфейса с default-методами',
      ],
      answer: 'Нет: класс унаследовал два несвязанных default-метода и обязан переопределить `move()`',
      explain: 'Порядок в `implements` ничего не значит. Ошибка: *class Duck inherits unrelated defaults for move() from types Walker and Swimmer*. Решение — переопределить метод и при желании вызвать нужную версию: `Walker.super.move()`.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
interface Walker  { default String move() { return "иду"; } }
interface Swimmer { default String move() { return "плыву"; } }

class Duck implements Walker, Swimmer {
    @Override
    public String move() {
        return Swimmer.super.move() + "-" + Walker.super.move();
    }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(new Duck().move());
    }
}
\`\`\``,
      answer: ['плыву-иду'],
      explain: '`Интерфейс.super.метод()` вызывает default-реализацию конкретного интерфейса. Порядок определяется кодом метода, а не порядком в `implements`.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
interface Greeting {
    default String hi() { return "interface"; }
}
class Base {
    public String hi() { return "class"; }
}
class Child extends Base implements Greeting { }

public class Main {
    public static void main(String[] args) {
        System.out.println(new Child().hi());
    }
}
\`\`\``,
      answer: ['class'],
      explain: 'Правило «класс побеждает»: метод, унаследованный от суперкласса, важнее default-метода интерфейса. Конфликта нет, переопределять ничего не нужно. (Важно, что `Base.hi()` — `public`: иначе была бы ошибка о сужении доступа.)',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
interface A {
    default String hi() { return "A"; }
}
interface B extends A {
    default String hi() { return "B"; }
}
class C implements A, B { }

public class Main {
    public static void main(String[] args) {
        System.out.println(new C().hi());
    }
}
\`\`\``,
      answer: ['B'],
      explain: 'Правило «более конкретный интерфейс побеждает»: `B` расширяет `A` и переопределяет его default-метод, поэтому `B.hi()` считается более точной версией. Ошибки нет.',
    },
    {
      type: 'order',
      q: 'Класс `Child extends Base implements I`. Расставьте возможные источники реализации метода `hi()` по приоритету — от самого сильного к самому слабому.',
      items: [
        'Метод, объявленный в самом классе `Child`',
        'Метод, унаследованный от суперкласса `Base`',
        'default-метод более конкретного интерфейса (наследника)',
        'default-метод более общего интерфейса (предка)',
      ],
      join: ' → ',
    },
    {
      type: 'choice',
      q: `Какие вызовы в \`main\` **скомпилируются**? Выберите все.
\`\`\`java
interface MathUtil {
    static int twice(int x) { return 2 * x; }
}
class Calc implements MathUtil { }

// в main:
int a = MathUtil.twice(2);      // (1)
int b = Calc.twice(2);          // (2)
int c = new Calc().twice(2);    // (3)
\`\`\``,
      options: ['(1)', '(2)', '(3)'],
      answer: ['(1)'],
      explain: 'static-методы интерфейса **не наследуются** реализующими классами: вызвать их можно только через имя интерфейса. Это отличие от static-методов классов, которые доступны и через подкласс.',
    },
    {
      type: 'gaps',
      q: 'Дополните код: интерфейс логгера с методом по умолчанию и его реализация.',
      text: `[interface] Logger {
    void log(String msg);

    [default] void info(String msg) {
        log("INFO: " + msg);
    }
}

class ConsoleLogger [implements] Logger {
    @Override
    [public] void log(String msg) {
        System.out.println(msg);
    }
}`,
      code: true,
      caseSensitive: true,
      explain: 'Метод с телом в интерфейсе помечается `default`. Класс реализует интерфейс через `implements`. Реализация обязана быть `public`, потому что метод интерфейса неявно `public`.',
    },
    {
      type: 'choice',
      q: 'Какие из интерфейсов являются **функциональными** (к ним можно применить `@FunctionalInterface`)? Выберите все.',
      options: [
        '`interface A { void run(); }`',
        '`interface B { void first(); void second(); }`',
        '`interface C { int f(int x); default int g() { return 0; } }`',
        '`interface D { boolean test(String s); boolean equals(Object o); }`',
        '`interface E { }`',
      ],
      answer: ['`interface A { void run(); }`', '`interface C { int f(int x); default int g() { return 0; } }`', '`interface D { boolean test(String s); boolean equals(Object o); }`'],
      explain: 'Функциональный — ровно один абстрактный метод. default-методы не считаются. `equals(Object)` — публичный метод класса `Object`, он у любого объекта уже есть, поэтому тоже не считается (так устроен `Comparator`). В `B` два абстрактных метода, в `E` — ни одного.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
@FunctionalInterface
interface Operation {
    int apply(int a, int b);
}
public class Main {
    public static void main(String[] args) {
        Operation plus = (a, b) -> a + b;
        Operation pow = (a, b) -> {
            int r = 1;
            for (int i = 0; i < b; i++) r *= a;
            return r;
        };
        System.out.println(plus.apply(2, 3) + " " + pow.apply(2, 3));
    }
}
\`\`\``,
      answer: ['5 8'],
      explain: 'Лямбда — это реализация единственного абстрактного метода `apply`. `plus.apply(2, 3)` = 5, `pow.apply(2, 3)` = 2³ = 8.',
    },
    {
      type: 'choice',
      q: 'Дан `sealed interface Shape permits Square { }`. Какие объявления `Square` (в том же файле) **допустимы**? Выберите все.',
      options: [
        '`final class Square implements Shape { }`',
        '`non-sealed class Square implements Shape { }`',
        '`record Square(double side) implements Shape { }`',
        '`class Square implements Shape { }`',
        '`sealed class Square implements Shape { }` (и больше никаких классов)',
      ],
      answer: ['`final class Square implements Shape { }`', '`non-sealed class Square implements Shape { }`', '`record Square(double side) implements Shape { }`'],
      explain: 'Разрешённый потомок sealed-типа обязан выбрать `final`, `sealed` или `non-sealed`. Record неявно `final` — подходит. Просто `class` — ошибка (*sealed, non-sealed or final modifiers expected*). `sealed`-класс без единого потомка — тоже ошибка (*sealed class must have subclasses*).',
    },
    {
      type: 'choice',
      q: 'Что верно для **интерфейса**, но **не** для абстрактного класса? Выберите все.',
      options: [
        'Класс может реализовать сразу несколько таких типов',
        'Все поля неявно `public static final`',
        'Не может иметь конструктор',
        'Нельзя создать объект через `new`',
        'Может содержать методы с реализацией',
        'Может хранить изменяемое состояние объекта',
      ],
      answer: ['Класс может реализовать сразу несколько таких типов', 'Все поля неявно `public static final`', 'Не может иметь конструктор'],
      explain: 'Создать через `new` нельзя ни то, ни другое. Методы с реализацией есть у обоих (у интерфейса — default/static/private). Изменяемое состояние — только у абстрактного класса.',
    },
    {
      type: 'choice',
      q: 'Классы `Document`, `Photo` и `User` никак не связаны наследованием (у `User` уже есть суперкласс `Person`). Каждый нужно уметь экспортировать в JSON методом `toJson()`. Как лучше это оформить?',
      options: [
        'Интерфейс `JsonExportable` с методом `String toJson()`, который реализуют все три класса',
        'Абстрактный класс `JsonExportable`, от которого наследуются все три класса',
        'Статический метод с цепочкой `instanceof` для каждого класса',
        'Скопировать метод `toJson()` в каждый класс без общего типа',
      ],
      answer: 'Интерфейс `JsonExportable` с методом `String toJson()`, который реализуют все три класса',
      explain: 'Это способность («умеет экспортироваться»), а не родство. `User` уже наследует `Person`, а наследовать два класса нельзя — абстрактный класс не подходит. Интерфейс даёт общий тип, с которым может работать код экспорта, — без цепочек `instanceof`.',
    },
    {
      type: 'flashcard',
      front: 'Абстрактный класс или интерфейс — **как выбрать**?',
      back: '**Интерфейс** — по умолчанию: когда описываем тип или способность («умеет»), особенно для неродственных классов; класс может реализовать много интерфейсов.\n\n**Абстрактный класс** — когда у близкородственных классов («является») есть общее состояние и код: поля, конструктор, шаблонный метод.\n\nЧасто вместе: интерфейс `List` + каркас `AbstractList`.',
    },
    {
      type: 'flashcard',
      front: 'Что такое паттерн **«Шаблонный метод»** (Template Method)?',
      back: 'В абстрактном классе пишется `final`-метод с общим алгоритмом, который вызывает отдельные шаги. Изменяемые шаги объявлены `abstract` (обязательные) или имеют реализацию по умолчанию («крючки», hooks). Потомки реализуют только шаги, не меняя порядок алгоритма.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Три правила разрешения конфликта **default-методов**',
      back: '1. **Класс побеждает**: метод класса или суперкласса важнее любого default-метода.\n2. **Более конкретный интерфейс побеждает**: если `B extends A`, берётся default из `B`.\n3. **Иначе** — ошибка компиляции: класс обязан переопределить метод; выбрать версию можно через `A.super.m()`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: `Создайте абстрактный класс \`Employee\` с полем \`name\`, конструктором, абстрактным методом \`double monthlySalary()\` и **шаблонным** \`final\`-методом \`String payslip()\`, который возвращает строку вида \`Аня: 50000.0\`. Создайте потомков: \`SalariedEmployee\` (фиксированный оклад) и \`HourlyEmployee\` (часы × ставка). В \`main\` выведите расчётные листки для массива сотрудников.`,
      starter: `abstract class Employee {
    // ...
}

public class Main {
    public static void main(String[] args) {
        Employee[] staff = {
            new SalariedEmployee("Аня", 50000),
            new HourlyEmployee("Борис", 120, 300)
        };
        // ...
    }
}`,
      solution: `abstract class Employee {
    private final String name;

    protected Employee(String name) {
        this.name = name;
    }

    public String getName() { return name; }

    protected abstract double monthlySalary();

    public final String payslip() {
        return name + ": " + monthlySalary();
    }
}

class SalariedEmployee extends Employee {
    private final double salary;

    SalariedEmployee(String name, double salary) {
        super(name);
        this.salary = salary;
    }

    @Override
    protected double monthlySalary() { return salary; }
}

class HourlyEmployee extends Employee {
    private final int hours;
    private final double rate;

    HourlyEmployee(String name, int hours, double rate) {
        super(name);
        this.hours = hours;
        this.rate = rate;
    }

    @Override
    protected double monthlySalary() { return hours * rate; }
}

public class Main {
    public static void main(String[] args) {
        Employee[] staff = {
            new SalariedEmployee("Аня", 50000),
            new HourlyEmployee("Борис", 120, 300)
        };
        for (Employee e : staff) {
            System.out.println(e.payslip());
        }
        // Аня: 50000.0
        // Борис: 36000.0
    }
}`,
      explain: 'Общее состояние (`name`) и общий алгоритм (`payslip`) — в абстрактном классе; различие (`monthlySalary`) — в потомках. `final` у `payslip()` не даёт потомкам сломать формат.',
    },
    {
      type: 'code',
      lang: 'java',
      q: `Создайте функциональный интерфейс \`Discount\` с методом \`double apply(double price)\`, default-методом \`Discount then(Discount next)\` (применить сначала эту скидку, потом \`next\`) и static-методом \`Discount none()\`. Реализуйте скидки классом \`PercentDiscount\` (процент) и лямбдой «минус 100 рублей, но не ниже 0». Выведите цену 1000 после скидки 10%, а затем минус 100.`,
      starter: `interface Discount {
    // ...
}

public class Main {
    public static void main(String[] args) {
        // ...
    }
}`,
      solution: `@FunctionalInterface
interface Discount {
    double apply(double price);

    default Discount then(Discount next) {
        return price -> next.apply(this.apply(price));
    }

    static Discount none() {
        return price -> price;
    }
}

class PercentDiscount implements Discount {
    private final double percent;

    PercentDiscount(double percent) {
        this.percent = percent;
    }

    @Override
    public double apply(double price) {
        return price * (100 - percent) / 100;
    }
}

public class Main {
    public static void main(String[] args) {
        Discount tenPercent = new PercentDiscount(10);
        Discount minus100 = price -> Math.max(0, price - 100);

        Discount combo = tenPercent.then(minus100);
        System.out.println(combo.apply(1000));             // 800.0
        System.out.println(Discount.none().apply(1000));   // 1000.0
    }
}`,
      explain: 'Интерфейс с одним абстрактным методом можно реализовать и классом, и лямбдой. default-метод `then` строит новую скидку из двух — вызывающему коду не нужно знать, как устроена каждая из них. `apply` в `PercentDiscount` — `public`, иначе ошибка.',
    },
  ],
});
