Trainer.add({
  id: 'java-09-polymorphism',
  title: 'Java 9. Полиморфизм',
  subject: 'Java',
  description: 'Динамическое связывание, восходящее и нисходящее приведение, instanceof, перегрузка против переопределения и классические подвохи: поля и static-методы не полиморфны, переопределённый метод в конструкторе.',
  lesson: `## Что такое полиморфизм и зачем он нужен

**Полиморфизм** (греч. «много форм») — это возможность работать с объектами разных классов через *общий тип*, при этом каждый объект выполняет одну и ту же команду *по-своему*. Один вызов — разные реализации.

Жизненная аналогия: у водителя права категории B. Он умеет водить «легковой автомобиль вообще» — ему не нужно переучиваться для каждой марки. Он нажимает педаль газа, а *как именно* машина разгоняется (бензиновый мотор, дизель, электродвигатель) — решает конкретный автомобиль. Водитель работает с общим понятием «автомобиль», а поведение определяет реальный объект.

Без полиморфизма код быстро превращается в цепочки проверок типа. **Плохо:**

\`\`\`java
static double area(Object shape) {
    if (shape instanceof Circle) {
        Circle c = (Circle) shape;
        return Math.PI * c.r * c.r;
    } else if (shape instanceof Rectangle) {
        Rectangle r = (Rectangle) shape;
        return r.w * r.h;
    }
    throw new IllegalArgumentException("Неизвестная фигура");
}
\`\`\`

Добавили треугольник — надо найти и исправить *все* такие методы (площадь, периметр, рисование…). Забыли один — ошибка при выполнении. **Хорошо:** каждая фигура сама знает, как считать свою площадь.

\`\`\`java
class Shape {
    double area() { return 0; }    // в уроке 10 сделаем этот метод абстрактным
}
class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
}
class Rectangle extends Shape {
    private final double w, h;
    Rectangle(double w, double h) { this.w = w; this.h = h; }
    @Override double area() { return w * h; }
}

Shape[] shapes = { new Circle(1), new Rectangle(2, 3) };
double total = 0;
for (Shape s : shapes) {
    total += s.area();   // какой area() вызвать — решается для каждого объекта отдельно
}
System.out.println(total); // выведет: 9.141592653589793
\`\`\`

Цикл ничего не знает о кругах и прямоугольниках. Новая фигура \`Triangle\` — это просто новый класс; цикл и остальной код менять не нужно. Это и есть главная польза полиморфизма: **код, написанный для общего типа, автоматически работает с новыми подтипами**.

В теории различают три вида полиморфизма:
- **ad hoc** (специальный) — перегрузка методов: \`print(int)\`, \`print(String)\`. Выбор при компиляции.
- **полиморфизм подтипов** — переопределение методов + динамическое связывание. Выбор при выполнении. *Когда в ООП говорят «полиморфизм», имеют в виду именно его.*
- **параметрический** — обобщения (generics): \`List<T>\` (урок 14).

## Объявленный тип и реальный тип

\`\`\`java
class Animal {
    String sound() { return "..."; }
}
class Dog extends Animal {
    @Override String sound() { return "Гав"; }
    void fetch() { System.out.println("Несу палку"); }
}
class Cat extends Animal {
    @Override String sound() { return "Мяу"; }
}

Animal a = new Dog();          // объявленный тип — Animal, реальный — Dog
System.out.println(a.sound()); // выведет: Гав
// a.fetch();                  // ошибка компиляции: в классе Animal нет fetch()
\`\`\`

У каждой ссылки два типа:
- **объявленный (статический)** — тип переменной, \`Animal\`. Его знает *компилятор*;
- **реальный (динамический)** — класс объекта, созданного через \`new\`, \`Dog\`. Его знает *JVM* во время выполнения.

> 💡 **Запомни.** Компилятор смотрит на тип *ссылки* и решает, **можно ли** вызвать метод. JVM смотрит на *объект* и решает, **какую реализацию** выполнить.

Аналогия: ссылка — это пульт, объект — телевизор. На пульте «Animal» есть только кнопки, объявленные в \`Animal\` (кнопки \`fetch\` там нет, даже если телевизор её поддерживает). Но когда кнопку нажали, сигнал обрабатывает конкретный телевизор — по-своему.

## Динамическое (позднее) связывание

Когда вызывается метод экземпляра, JVM во время выполнения берёт **реальный класс объекта** и ищет метод с нужной сигнатурой начиная с этого класса и поднимаясь вверх по иерархии. Это называется **динамическим** или **поздним связыванием** (late binding). Внутри JVM для этого у каждого класса есть таблица виртуальных методов — поэтому такой вызов почти не медленнее обычного.

Связывание происходит **статически** (при компиляции, по объявленному типу) для:
- \`static\`-методов — они принадлежат классу, а не объекту;
- \`private\`-методов — они не видны потомкам и не переопределяются;
- конструкторов;
- **полей** — поля вообще не полиморфны (подробно ниже).

\`final\`-методы вызываются обычным образом, но переопределить их нельзя, поэтому выбирать всё равно не из чего.

## Восходящее и нисходящее приведение

**Восходящее приведение (upcasting)** — от потомка к предку. Оно неявное и всегда безопасно: собака — это всегда животное.

\`\`\`java
Dog dog = new Dog();
Animal a = dog;              // неявно, без проверок
Object o = dog;              // тоже можно: Object — предок всех классов
\`\`\`

**Нисходящее приведение (downcasting)** — от предка к потомку. Оно пишется явно, и компилятор *верит вам на слово*. Проверка происходит при выполнении: если объект на самом деле другого класса — летит \`ClassCastException\`.

\`\`\`java
Animal a = new Cat();
Dog d = (Dog) a;             // компилируется, но при запуске — ClassCastException
\`\`\`

Компилятор всё же отсекает **заведомо невозможные** приведения:

\`\`\`java
Cat cat = new Cat();
Dog d1 = (Dog) cat;          // ошибка компиляции: Cat никогда не может быть Dog
String s = (String) a;       // ошибка компиляции: Animal никогда не может быть String
Runnable r = (Runnable) a;   // компилируется! Какой-нибудь потомок Animal может реализовать Runnable
\`\`\`

\`Cat\` и \`Dog\` — «братья», ни один не наследует другого, значит переменная типа \`Cat\` никогда не укажет на \`Dog\`. \`String\` — \`final\`-класс и не потомок \`Animal\`. А вот к интерфейсу привести не-\`final\` класс можно всегда: компилятор не может исключить, что существует подкласс, реализующий этот интерфейс.

### instanceof и сопоставление с образцом

Перед нисходящим приведением тип проверяют оператором \`instanceof\`:

\`\`\`java
if (a instanceof Dog) {
    Dog d = (Dog) a;
    d.fetch();
}
\`\`\`

С Java 16 то же самое пишут короче — **pattern matching для instanceof**: проверка, приведение и объявление переменной в одном выражении.

\`\`\`java
if (a instanceof Dog d) {
    d.fetch();               // d уже имеет тип Dog
}
\`\`\`

Переменная \`d\` существует только там, где проверка *гарантированно* прошла:

\`\`\`java
if (a instanceof Dog d && d.isGood()) { }  // можно: справа от && проверка уже прошла
// if (a instanceof Dog d || d.isGood()) { } // ошибка: при false слева d не определена
if (!(a instanceof Dog d)) {
    return;
}
d.fetch();                                 // можно: сюда попадаем, только если a — Dog
\`\`\`

> ⚠️ **Подвох.** \`null instanceof Что_угодно\` — это всегда \`false\` (без исключения). Поэтому \`instanceof\` заодно защищает от \`NullPointerException\`.

> ⚠️ **Подвох.** Длинная цепочка \`if (x instanceof A) … else if (x instanceof B) …\`, выбирающая *поведение*, — признак того, что вы не используете полиморфизм. Перенесите поведение в переопределённый метод.

## Полиморфные массивы, списки и параметры

Массив или список родительского типа может хранить объекты любых потомков, а метод с параметром родительского типа принимает любого потомка:

\`\`\`java
static void introduce(Animal a) {
    System.out.println(a.getClass().getSimpleName() + ": " + a.sound());
}

Animal[] zoo = { new Dog(), new Cat(), new Animal() };
for (Animal a : zoo) {
    introduce(a);
}
// выведет:
// Dog: Гав
// Cat: Мяу
// Animal: ...
\`\`\`

## Перегрузка против переопределения — главный подвох

| | Перегрузка (overloading) | Переопределение (overriding) |
|---|---|---|
| Что это | Методы с одним именем, но разными параметрами | Метод потомка с той же сигнатурой, что у предка |
| Где | В одном классе или в иерархии | Только в потомке |
| Когда выбирается | При **компиляции** | При **выполнении** |
| По какому типу | По **объявленным** типам аргументов | По **реальному** классу объекта, у которого вызван метод |

\`\`\`java
class Vet {
    void treat(Animal a) { System.out.println("лечим животное"); }
    void treat(Dog d)    { System.out.println("лечим собаку"); }
}

Animal a = new Dog();
Vet vet = new Vet();
vet.treat(a);          // выведет: лечим животное
vet.treat(new Dog());  // выведет: лечим собаку
vet.treat((Dog) a);    // выведет: лечим собаку
\`\`\`

Хотя в \`a\` лежит собака, первый вызов печатает «лечим животное»: вариант перегрузки компилятор выбрал *заранее*, глядя на объявленный тип аргумента — \`Animal\`. Во время выполнения выбор вариантов перегрузки уже не пересматривается.

Теперь оба механизма сразу — любимая задача контрольных и собеседований:

\`\`\`java
class A {
    void hello(A x) { System.out.println("A.hello(A)"); }
}
class B extends A {
    @Override
    void hello(A x) { System.out.println("B.hello(A)"); }
    void hello(B x) { System.out.println("B.hello(B)"); } // перегрузка, а НЕ переопределение
}

A ab = new B();
B b = new B();
ab.hello(b);   // выведет: B.hello(A)
b.hello(b);    // выведет: B.hello(B)
b.hello(ab);   // выведет: B.hello(A)
\`\`\`

Решаем в два шага — это алгоритм на все такие задачи:
1. **Компиляция.** Компилятор смотрит на *объявленный тип ссылки* слева от точки и ищет там подходящие методы по *объявленным типам аргументов*. Для \`ab.hello(b)\` ссылка имеет тип \`A\`, а в \`A\` есть только \`hello(A)\` — сигнатура выбрана: \`hello(A)\`. Метод \`hello(B)\` компилятор даже не рассматривает: в классе \`A\` его нет.
2. **Выполнение.** JVM берёт *реальный класс объекта* (\`B\`) и ищет в нём переопределение *именно выбранной сигнатуры* \`hello(A)\`. Находит \`B.hello(A)\`.

Для \`b.hello(b)\` ссылка имеет тип \`B\`, кандидатов два, и компилятор берёт самый точный — \`hello(B)\`. Для \`b.hello(ab)\` аргумент объявлен как \`A\`, поэтому подходит только \`hello(A)\`.

> ⚠️ **Подвох.** Метод с тем же именем, но другим типом параметра в потомке — это **перегрузка**, а не переопределение. Классическая ошибка: \`public boolean equals(Point p)\` вместо \`equals(Object o)\` (урок 11). Ставьте \`@Override\` — компилятор сразу скажет, что метод ничего не переопределяет.

## Поля не полиморфны

\`\`\`java
class Parent {
    String name = "Parent";
    String getName() { return name; }
}
class Child extends Parent {
    String name = "Child";                 // НОВОЕ поле, оно затеняет Parent.name
    @Override String getName() { return name; }
}

Parent p = new Child();
System.out.println(p.name);           // выведет: Parent
System.out.println(p.getName());      // выведет: Child
System.out.println(((Child) p).name); // выведет: Child
\`\`\`

Объект \`Child\` содержит **два** поля \`name\`: унаследованное и своё. Обращение к полю компилятор связывает по *объявленному* типу ссылки, поэтому \`p.name\` — это поле из \`Parent\`. А метод \`getName()\` переопределён — он выбирается по реальному типу и читает поле \`Child\`.

> 💡 **Запомни.** Полиморфны только методы экземпляра. Поля делайте \`private\`, не объявляйте в потомке поле с тем же именем и обращайтесь к данным через методы — тогда этот подвох просто не возникнет.

## static-методы скрываются, а не переопределяются

\`\`\`java
class Parent {
    static String info() { return "static Parent"; }
}
class Child extends Parent {
    static String info() { return "static Child"; } // сокрытие (hiding)
}

Parent p = new Child();
System.out.println(p.info());     // выведет: static Parent
System.out.println(Child.info()); // выведет: static Child
\`\`\`

\`static\`-метод принадлежит классу, объекта для него не нужно, поэтому вызов через ссылку компилятор заменяет вызовом по *объявленному* типу. Это называется **сокрытием** (hiding). Попытка поставить \`@Override\` над \`static\`-методом — ошибка компиляции. Также нельзя объявить в потомке метод экземпляра с сигнатурой \`static\`-метода предка и наоборот — тоже ошибка компиляции.

## private-методы тоже не переопределяются

\`\`\`java
class Parent {
    private void secret() { System.out.println("Parent.secret"); }
    void run() { secret(); }
}
class Child extends Parent {
    void secret() { System.out.println("Child.secret"); } // новый метод, не переопределение
}

new Child().run(); // выведет: Parent.secret
\`\`\`

\`Child\` не видит \`private\`-метод предка, поэтому его \`secret()\` — совершенно независимый метод. Вызов \`secret()\` внутри \`Parent.run()\` связан с \`Parent.secret()\` намертво. Если бы \`secret()\` в \`Parent\` был не \`private\`, напечаталось бы \`Child.secret\`.

## Самый коварный подвох: переопределённый метод в конструкторе

\`\`\`java
class Base {
    Base() {
        System.out.println("Base()");
        describe();                       // вызов переопределяемого метода!
    }
    void describe() { System.out.println("Base.describe"); }
}
class Derived extends Base {
    private int size = 10;
    private String label = "box";
    Derived() {
        System.out.println("Derived(): size=" + size);
    }
    @Override
    void describe() { System.out.println("size=" + size + ", label=" + label); }
}

new Derived();
// выведет:
// Base()
// size=0, label=null
// Derived(): size=10
\`\`\`

Почему \`0\` и \`null\`? Порядок создания объекта \`Derived\`:
1. Выделяется память, **все** поля (и \`Base\`, и \`Derived\`) получают значения по умолчанию: \`0\`, \`null\`, \`false\`.
2. Конструктор \`Derived\` первым делом вызывает \`super()\` — выполняется конструктор \`Base\`.
3. \`Base()\` вызывает \`describe()\`. Объект уже *является* \`Derived\`, поэтому срабатывает динамическое связывание — выполняется \`Derived.describe()\`. Но инициализаторы полей \`Derived\` ещё не выполнялись: \`size = 0\`, \`label = null\`.
4. Только после возврата из \`super()\` выполняются инициализаторы полей \`Derived\` (\`size = 10\`, \`label = "box"\`).
5. Выполняется тело конструктора \`Derived\`.

Если бы \`describe()\` обращался, например, к \`label.length()\`, программа упала бы с \`NullPointerException\` прямо в конструкторе.

> 💡 **Правило.** Не вызывайте из конструктора методы, которые можно переопределить. Если конструктору нужен вспомогательный метод — делайте его \`private\`, \`final\` или \`static\`.

> ⚠️ **Тонкость.** Если поле объявлено как \`private final int size = 10;\` (final + значение-константа), компилятор подставляет \`10\` прямо в код, и метод напечатает \`10\` даже из конструктора предка. Но для обычных полей и для \`final\`-полей, инициализированных не константой (например, \`new ArrayList<>()\`), всё будет именно так, как в примере выше.

## super.method() и this внутри методов предка

\`super.метод()\` — **не** полиморфный вызов: он всегда вызывает версию из непосредственного предка. А обычный вызов \`метод()\` (то есть \`this.метод()\`) внутри кода предка — полиморфный.

\`\`\`java
class Employee {
    double salary() { return 1000; }
    String info() { return "Зарплата: " + salary(); }   // this.salary() — полиморфно
}
class Manager extends Employee {
    @Override
    double salary() { return super.salary() * 1.5; }     // версия Employee
}

Employee e = new Manager();
System.out.println(e.info()); // выведет: Зарплата: 1500.0
\`\`\`

\`info()\` не переопределён, выполняется код \`Employee\`. Но внутри него \`salary()\` вызывается у объекта \`Manager\` — значит, работает \`Manager.salary()\`, который через \`super\` берёт базовые 1000 и умножает на 1.5.

## Программируй на уровне интерфейса (супертипа)

Объявляйте переменные, параметры и возвращаемые значения **самым общим типом**, которого достаточно для задачи:

\`\`\`java
// Плохо: код привязан к конкретной реализации
ArrayList<String> names = new ArrayList<>();
static void printAll(ArrayList<String> list) { /* ... */ }

// Хорошо: подойдёт любой список — ArrayList, LinkedList, List.of(...)
List<String> names = new ArrayList<>();
static void printAll(List<String> list) { /* ... */ }
\`\`\`

То же с собственными классами. Сервис заказов не должен знать, *как* именно отправляется уведомление:

\`\`\`java
class Notifier {
    void send(String text) { System.out.println("LOG: " + text); }
}
class EmailNotifier extends Notifier {
    @Override void send(String text) { System.out.println("Письмо: " + text); }
}
class SmsNotifier extends Notifier {
    @Override void send(String text) { System.out.println("SMS: " + text); }
}
class OrderService {
    private final Notifier notifier;               // общий тип
    OrderService(Notifier notifier) { this.notifier = notifier; }
    void placeOrder(String item) {
        notifier.send("Заказ оформлен: " + item);  // полиморфный вызов
    }
}

new OrderService(new SmsNotifier()).placeOrder("книга"); // выведет: SMS: Заказ оформлен: книга
\`\`\`

Чтобы добавить уведомления в Telegram, достаточно написать новый подкласс — \`OrderService\` не меняется. В следующем уроке \`Notifier\` станет интерфейсом, а в уроке 15 этот приём получит имя — принцип инверсии зависимостей.

## Шпаргалка

| Что вызывается | Когда выбирается | По какому типу |
|---|---|---|
| Переопределённый метод экземпляра | при выполнении | реальный класс объекта |
| Вариант перегруженного метода | при компиляции | объявленные типы аргументов |
| static-метод | при компиляции | объявленный тип ссылки |
| private-метод | при компиляции | класс, в котором написан вызов |
| Поле | при компиляции | объявленный тип ссылки |
| Список доступных методов | при компиляции | объявленный тип ссылки |
| \`super.m()\` | при компиляции | непосредственный предок |

- Восходящее приведение — неявное и безопасное; нисходящее — явное, может бросить \`ClassCastException\`.
- Заведомо невозможное приведение (между «братьями», к чужому \`final\`-классу) — ошибка компиляции.
- \`x instanceof T t\` — проверка + приведение + переменная; \`null instanceof T\` — \`false\`.
- Задачи «что выведет»: шаг 1 — сигнатуру выбирает компилятор по объявленным типам; шаг 2 — реализацию этой сигнатуры выбирает JVM по реальному классу.
- Не вызывайте переопределяемые методы из конструктора; не затеняйте поля.`,
  tasks: [
    {
      type: 'choice',
      q: 'Что в ООП называют **полиморфизмом подтипов**?',
      options: [
        'Работу с объектами разных подклассов через ссылку общего типа, когда вызывается реализация метода из реального класса объекта',
        'Возможность объявить в классе несколько методов с одинаковым именем и разными параметрами',
        'Сокрытие полей класса с помощью private и доступ к ним через геттеры',
        'Возможность класса наследоваться сразу от нескольких классов',
      ],
      answer: 'Работу с объектами разных подклассов через ссылку общего типа, когда вызывается реализация метода из реального класса объекта',
      explain: 'Несколько методов с одним именем — это перегрузка (ad hoc полиморфизм, выбор при компиляции). Сокрытие полей — инкапсуляция. Множественного наследования классов в Java нет.',
    },
    {
      type: 'choice',
      q: `Что выведет код?
\`\`\`java
class Animal {
    String sound() { return "..."; }
}
class Dog extends Animal {
    @Override String sound() { return "Гав"; }
}
class Cat extends Animal {
    @Override String sound() { return "Мяу"; }
}
public class Main {
    public static void main(String[] args) {
        Animal a = new Cat();
        System.out.println(a.sound());
    }
}
\`\`\``,
      options: ['`Мяу`', '`...`', '`Гав`', 'Ошибка компиляции'],
      answer: '`Мяу`',
      explain: 'Метод экземпляра выбирается при выполнении по реальному классу объекта (`Cat`), а не по типу переменной (`Animal`). Это динамическое связывание.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
class Animal {
    String sound() { return "..."; }
}
class Dog extends Animal {
    void fetch() { System.out.println("Несу палку"); }
}
public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        a.fetch();
    }
}
\`\`\``,
      options: [
        'Да, выведет «Несу палку»',
        'Нет: в классе `Animal` нет метода `fetch()`',
        'Скомпилируется, но при запуске будет `ClassCastException`',
        'Скомпилируется, но при запуске будет `NoSuchMethodError`',
      ],
      answer: 'Нет: в классе `Animal` нет метода `fetch()`',
      explain: 'Какие методы можно вызвать, решает компилятор по объявленному типу ссылки. Для него `a` — это `Animal`, а у `Animal` нет `fetch()`. Чтобы вызвать — нужна проверка и приведение: `if (a instanceof Dog d) d.fetch();`',
    },
    {
      type: 'match',
      q: 'Соедините термин и его описание',
      pairs: [
        ['Восходящее приведение', 'Ссылке типа предка присваивается объект потомка; неявно и всегда безопасно'],
        ['Нисходящее приведение', 'Явное приведение к типу потомка; если объект другого класса — ClassCastException'],
        ['Динамическое связывание', 'Реализация метода выбирается при выполнении по реальному классу объекта'],
        ['Перегрузка', 'Методы с одним именем и разными параметрами; вариант выбирается при компиляции'],
        ['Сокрытие метода', 'static-метод потомка с той же сигнатурой, что и static-метод предка'],
        ['Затенение поля', 'Поле потомка с тем же именем, что и поле предка; в объекте живут оба'],
      ],
    },
    {
      type: 'choice',
      q: `Что произойдёт? (\`Dog\` и \`Cat\` — наследники \`Animal\`)
\`\`\`java
Animal a = new Cat();
Dog d = (Dog) a;
System.out.println("OK");
\`\`\``,
      options: [
        'Выведет `OK`',
        'Ошибка компиляции',
        'Исключение `ClassCastException` при выполнении',
        'Выведет `OK`, а `d` будет равно `null`',
      ],
      answer: 'Исключение `ClassCastException` при выполнении',
      explain: 'Компилятор пропускает приведение `Animal → Dog`: переменная типа `Animal` вполне может указывать на собаку. Но при выполнении JVM проверяет реальный объект — это `Cat` — и бросает `ClassCastException`. Приведение никогда не «превращает» объект в другой класс и не возвращает `null`.',
    },
    {
      type: 'choice',
      q: `А теперь? (\`Dog\` и \`Cat\` — наследники \`Animal\`)
\`\`\`java
Cat c = new Cat();
Dog d = (Dog) c;
System.out.println("OK");
\`\`\``,
      options: [
        'Выведет `OK`',
        'Ошибка компиляции',
        'Исключение `ClassCastException` при выполнении',
        'Выведет `OK`, а `d` будет равно `null`',
      ],
      answer: 'Ошибка компиляции',
      explain: 'Здесь объявленный тип — `Cat`. `Cat` и `Dog` — «братья», ни один не наследует другого, поэтому переменная типа `Cat` никогда не может указывать на `Dog`. Компилятор видит, что приведение заведомо невозможно: *incompatible types: Cat cannot be converted to Dog*.',
    },
    {
      type: 'choice',
      q: `Класс \`Animal\` не \`final\` и не реализует никаких интерфейсов. Что можно сказать о строках (1) и (2)?
\`\`\`java
Animal a = new Animal();
Runnable r = (Runnable) a;   // (1)
String s = (String) a;       // (2)
\`\`\``,
      options: [
        '(1) компилируется (но при запуске будет `ClassCastException`), (2) — ошибка компиляции',
        'Обе строки компилируются и обе бросят `ClassCastException`',
        '(1) — ошибка компиляции, (2) компилируется',
        'Обе строки — ошибки компиляции',
      ],
      answer: '(1) компилируется (но при запуске будет `ClassCastException`), (2) — ошибка компиляции',
      explain: 'К интерфейсу можно привести любой не-final класс: вдруг существует потомок `Animal`, реализующий `Runnable`. А `String` — final-класс и не наследник `Animal`, такого объекта быть не может в принципе, и компилятор это видит.',
    },
    {
      type: 'choice',
      q: 'Что из перечисленного выбирается **при компиляции** (статически), а не во время выполнения? Выберите все.',
      options: [
        'Вызов `static`-метода через ссылку',
        'Вызов `private`-метода',
        'Выбор варианта перегруженного метода',
        'Обращение к полю объекта через ссылку',
        'Реализация `public`-метода экземпляра, переопределённого в потомке',
        'Реализация `protected`-метода экземпляра, переопределённого в потомке',
      ],
      answer: ['Вызов `static`-метода через ссылку', 'Вызов `private`-метода', 'Выбор варианта перегруженного метода', 'Обращение к полю объекта через ссылку'],
      explain: 'Динамически (по реальному классу объекта) выбираются только реализации переопределяемых методов экземпляра — неважно, `public`, `protected` или package-private. `static`, `private`, перегрузка и поля связываются по объявленным типам.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Printer {
    void print(Object o) { System.out.println("Object"); }
    void print(String s) { System.out.println("String"); }
}
public class Main {
    public static void main(String[] args) {
        Object o = "привет";
        new Printer().print(o);
    }
}
\`\`\``,
      answer: ['Object'],
      explain: 'Вариант перегрузки выбирается при компиляции по **объявленному** типу аргумента. `o` объявлена как `Object` — значит, `print(Object)`. То, что внутри строка, компилятор не учитывает.',
    },
    {
      type: 'choice',
      q: `Что выведет код?
\`\`\`java
public class Main {
    static void show(Object o) { System.out.println("Object"); }
    static void show(String s) { System.out.println("String"); }

    public static void main(String[] args) {
        show(null);
    }
}
\`\`\``,
      options: ['`Object`', '`String`', 'Ошибка компиляции: неоднозначный вызов', '`NullPointerException`'],
      answer: '`String`',
      explain: '`null` подходит под оба параметра. Из подходящих перегрузок компилятор выбирает самую **конкретную**: `String` — подтип `Object`, поэтому `show(String)`. Если бы был ещё `show(Integer)`, вызов стал бы неоднозначным (`String` и `Integer` не связаны) — ошибка компиляции.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Animal {
    void meet(Animal other) { System.out.println("Animal meets Animal"); }
}
class Dog extends Animal {
    @Override
    void meet(Animal other) { System.out.println("Dog meets Animal"); }
    void meet(Dog other) { System.out.println("Dog meets Dog"); }
}
public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        Dog d = new Dog();
        a.meet(d);
    }
}
\`\`\``,
      answer: ['Dog meets Animal'],
      hint: 'Два шага: сначала компилятор выбирает сигнатуру по типу ссылки `a`, потом JVM ищет её реализацию в реальном классе.',
      explain: 'Шаг 1 (компиляция): `a` объявлена как `Animal`, а в `Animal` есть только `meet(Animal)` — сигнатура выбрана. `meet(Dog)` компилятор не видит. Шаг 2 (выполнение): объект — `Dog`, в нём есть переопределение `meet(Animal)` → «Dog meets Animal».',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
class A {
    void f(A x) { System.out.print("1 "); }
}
class B extends A {
    void f(A x) { System.out.print("2 "); }
    void f(B x) { System.out.print("3 "); }
}
public class Main {
    public static void main(String[] args) {
        A ab = new B();
        B b = new B();
        A a = new A();
        ab.f(b);
        b.f(ab);
        b.f(b);
        a.f(b);
    }
}
\`\`\``,
      answer: ['2 2 3 1'],
      explain: '`ab.f(b)`: тип ссылки `A` → сигнатура `f(A)`; объект `B` → `B.f(A)` → 2. `b.f(ab)`: аргумент объявлен как `A` → `f(A)` → 2. `b.f(b)`: в `B` есть `f(B)` — самый точный вариант → 3. `a.f(b)`: объект класса `A` → `A.f(A)` → 1.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Parent {
    String name = "Parent";
    String getName() { return name; }
}
class Child extends Parent {
    String name = "Child";
}
public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.name + " " + p.getName() + " " + ((Child) p).name);
    }
}
\`\`\``,
      answer: ['Parent Parent Child'],
      explain: 'Поля не полиморфны: `p.name` берётся по объявленному типу `Parent`. `getName()` в `Child` **не переопределён**, а код `Parent.getName()` обращается к полю своего класса — тоже «Parent». После приведения к `Child` видно затеняющее поле — «Child». Если бы `Child` переопределил `getName()`, второе слово было бы «Child».',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Parent {
    static String who() { return "P"; }
    String me() { return "p"; }
}
class Child extends Parent {
    static String who() { return "C"; }
    @Override String me() { return "c"; }
}
public class Main {
    public static void main(String[] args) {
        Parent x = new Child();
        System.out.println(x.who() + x.me());
    }
}
\`\`\``,
      answer: ['Pc'],
      explain: '`static`-метод не переопределяется, а скрывается: вызов `x.who()` компилятор заменяет на `Parent.who()` по объявленному типу. `me()` — обычный метод экземпляра, выбирается по реальному классу `Child`.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
class Parent {
    static void log() { }
}
class Child extends Parent {
    @Override
    static void log() { }
}
\`\`\``,
      options: [
        'Да: `Child.log()` переопределяет `Parent.log()`',
        'Да: это сокрытие, а `@Override` просто игнорируется',
        'Нет: `static`-метод нельзя пометить `@Override`',
        'Нет: в потомке нельзя объявить метод с тем же именем',
      ],
      answer: 'Нет: `static`-метод нельзя пометить `@Override`',
      explain: '`static`-методы не переопределяются, поэтому `@Override` над ними — ошибка: *static method log() in Child cannot be annotated with @Override*. Без аннотации код скомпилируется — это будет сокрытие (hiding).',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Parent {
    private String id() { return "P"; }
    String hook() { return "p"; }
    String show() { return id() + hook(); }
}
class Child extends Parent {
    String id() { return "C"; }
    @Override String hook() { return "c"; }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(new Child().show());
    }
}
\`\`\``,
      answer: ['Pc'],
      explain: '`private`-метод `id()` не наследуется и не переопределяется: `id()` в `Child` — независимый метод, а вызов внутри `Parent.show()` всегда ведёт в `Parent.id()`. `hook()` — обычный метод, переопределён → «c».',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите строки через пробел.
\`\`\`java
class Base {
    Base() { show(); }
    void show() { System.out.println("Base"); }
}
class Derived extends Base {
    int x = 5;
    Derived() { show(); }
    @Override void show() { System.out.println("x=" + x); }
}
public class Main {
    public static void main(String[] args) {
        new Derived();
    }
}
\`\`\``,
      answer: ['x=0 x=5'],
      explain: 'Конструктор `Base` вызывает `show()` полиморфно — выполняется `Derived.show()`. Но поле `x` ещё не инициализировано (инициализаторы полей `Derived` выполняются после `super()`), поэтому `x=0`. Затем `x = 5`, и тело конструктора `Derived` печатает `x=5`.',
    },
    {
      type: 'order',
      q: 'В каком порядке происходят события при выполнении `new Derived()` из предыдущего задания?',
      items: [
        'Память выделена, все поля получили значения по умолчанию (`x = 0`)',
        'Вызван конструктор `Base` (неявный `super()`)',
        '`Base()` вызывает `show()` — выполняется `Derived.show()`',
        'Выполнены инициализаторы полей `Derived` (`x = 5`)',
        'Выполнено тело конструктора `Derived`',
      ],
      join: ' → ',
    },
    {
      type: 'choice',
      q: `Класс \`Dog\` имеет методы \`isGood()\` и \`fetch()\`, переменная \`a\` имеет тип \`Animal\`. Какие фрагменты **компилируются** (Java 17)? Выберите все.`,
      options: [
        '`if (a instanceof Dog d && d.isGood()) { }`',
        '`if (a instanceof Dog d || d.isGood()) { }`',
        '`if (!(a instanceof Dog d)) return; d.fetch();`',
        '`if (a instanceof Dog d) { } d.fetch();`',
      ],
      answer: ['`if (a instanceof Dog d && d.isGood()) { }`', '`if (!(a instanceof Dog d)) return; d.fetch();`'],
      explain: 'Переменная образца видна только там, где проверка гарантированно прошла. Справа от `&&` — прошла. Справа от `||` — нет (туда попадаем, когда слева `false`). После `if (!(… instanceof Dog d)) return;` — прошла, иначе мы бы вышли. После обычного `if` без выхода — неизвестно, поэтому `d` не видна.',
    },
    {
      type: 'choice',
      q: `Что выведет код?
\`\`\`java
Animal a = null;
System.out.println(a instanceof Animal);
\`\`\``,
      options: ['`true`', '`false`', '`NullPointerException`', 'Ошибка компиляции'],
      answer: '`false`',
      explain: '`instanceof` с `null` всегда даёт `false` и никогда не бросает исключение. Поэтому проверка `x instanceof T` заодно отсекает `null`.',
    },
    {
      type: 'gaps',
      q: 'Дополните код: пройдите по «зоопарку», выведите звук каждого животного, а собак заставьте принести палку. Используйте pattern matching.',
      text: `Animal\\[] zoo = { new Dog(), new Cat(), new Dog() };
for ([Animal] a [:] zoo) {
    System.out.println(a.[sound]());
    if (a [instanceof] Dog [d]) {
        d.fetch();
    }
}`,
      code: true,
      caseSensitive: true,
      explain: 'Массив типа `Animal[]` хранит любых потомков. `a.sound()` — полиморфный вызов. `a instanceof Dog d` проверяет тип и сразу объявляет переменную `d` типа `Dog`.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Employee {
    int bonus() { return 100; }
    int total() { return 1000 + bonus(); }
}
class Manager extends Employee {
    @Override int bonus() { return super.bonus() * 3; }
}
public class Main {
    public static void main(String[] args) {
        Employee e = new Manager();
        System.out.println(e.total());
    }
}
\`\`\``,
      answer: ['1300'],
      explain: '`total()` не переопределён — выполняется код `Employee`. Но вызов `bonus()` внутри него — это `this.bonus()`, а `this` — объект `Manager`, поэтому работает `Manager.bonus()` = `super.bonus() * 3` = 300. Итого 1000 + 300.',
    },
    {
      type: 'number',
      q: `Сколько раз увеличится \`count\`?
\`\`\`java
Object[] items = { "a", 1, 2.5, "b", null, 'c', 3L };
int count = 0;
for (Object o : items) {
    if (o instanceof Number) count++;
}
System.out.println(count);
\`\`\``,
      answer: '3',
      explain: 'Примитивы упаковываются: `1` → `Integer`, `2.5` → `Double`, `3L` → `Long` — все наследники `Number`. `\'c\'` → `Character` — не `Number`. Строки — тоже нет. `null instanceof Number` — `false`.',
    },
    {
      type: 'choice',
      q: 'Какая сигнатура метода лучше соответствует принципу «программируй на уровне интерфейса»?',
      options: [
        '`static double total(List<Order> orders)`',
        '`static double total(ArrayList<Order> orders)`',
        '`static double total(LinkedList<Order> orders)`',
        '`static double total(Object orders)`',
      ],
      answer: '`static double total(List<Order> orders)`',
      explain: 'Метод с параметром `List` принимает любой список: `ArrayList`, `LinkedList`, `List.of(...)`. С `ArrayList` вызывающий код вынужден использовать именно эту реализацию. `Object` — слишком общий: придётся проверять тип и приводить, а компилятор ничего не проверит.',
    },
    {
      type: 'flashcard',
      front: 'Перегрузка vs переопределение: **когда** и **по какому типу** выбирается метод?',
      back: '**Перегрузка** — при компиляции, по *объявленным* типам аргументов (и объявленному типу ссылки).\n\n**Переопределение** — при выполнении, по *реальному* классу объекта, у которого вызван метод.\n\nВ задачах «что выведет»: сначала компилятор выбирает сигнатуру, затем JVM ищет её реализацию в реальном классе.',
    },
    {
      type: 'flashcard',
      front: 'Почему нельзя вызывать переопределяемые методы из конструктора?',
      back: 'Конструктор предка выполняется **до** инициализации полей потомка. Вызов переопределяемого метода полиморфен, поэтому сработает версия потомка, которая увидит поля со значениями по умолчанию (`0`, `null`, `false`) — неверный результат или `NullPointerException`.\n\nРешение: вспомогательные методы конструктора делать `private`, `final` или `static`.',
      write: true,
    },
    {
      type: 'code',
      lang: 'java',
      q: `Создайте иерархию фигур: класс \`Shape\` с методами \`double area()\` и \`String name()\`, и наследники \`Circle\` (радиус), \`Rectangle\` (ширина, высота), \`Square\` (сторона; наследуется от \`Rectangle\`). Напишите статический метод \`Shape largest(Shape[] shapes)\`, возвращающий фигуру с наибольшей площадью, — **без** \`instanceof\` и приведений. В \`main\` выведите имя и площадь самой большой фигуры из массива \`{ new Circle(1), new Rectangle(2, 3), new Square(2) }\`.`,
      starter: `class Shape {
    double area() { return 0; }
    String name() { return "Фигура"; }
}

// Circle, Rectangle, Square

public class Main {
    static Shape largest(Shape[] shapes) {
        // ...
    }

    public static void main(String[] args) {
        Shape[] shapes = { new Circle(1), new Rectangle(2, 3), new Square(2) };
        // ...
    }
}`,
      solution: `class Shape {
    double area() { return 0; }
    String name() { return "Фигура"; }
}

class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
    @Override String name() { return "Круг"; }
}

class Rectangle extends Shape {
    private final double w, h;
    Rectangle(double w, double h) { this.w = w; this.h = h; }
    @Override double area() { return w * h; }
    @Override String name() { return "Прямоугольник"; }
}

class Square extends Rectangle {
    Square(double side) { super(side, side); }
    @Override String name() { return "Квадрат"; }
}

public class Main {
    static Shape largest(Shape[] shapes) {
        Shape best = shapes[0];
        for (Shape s : shapes) {
            if (s.area() > best.area()) {
                best = s;
            }
        }
        return best;
    }

    public static void main(String[] args) {
        Shape[] shapes = { new Circle(1), new Rectangle(2, 3), new Square(2) };
        Shape max = largest(shapes);
        System.out.println(max.name() + ": " + max.area()); // Прямоугольник: 6.0
    }
}`,
      explain: '`Square` переиспользует `area()` из `Rectangle` и переопределяет только `name()`. Метод `largest` работает с любыми будущими фигурами без изменений.',
    },
    {
      type: 'code',
      lang: 'java',
      q: `Перепишите код без цепочки \`if\`/\`instanceof\`: пусть каждый способ оплаты сам считает комиссию. Создайте базовый класс \`Payment\` с методом \`double fee(double amount)\` и наследников \`CardPayment\` (комиссия 2%), \`CashPayment\` (0), \`CryptoPayment\` (1% + 10). Метод \`totalFees\` должен работать с любыми будущими способами оплаты.`,
      starter: `// Было (плохо):
static double fee(Object payment, double amount) {
    if (payment instanceof CardPayment) {
        return amount * 0.02;
    } else if (payment instanceof CashPayment) {
        return 0;
    } else if (payment instanceof CryptoPayment) {
        return amount * 0.01 + 10;
    }
    throw new IllegalArgumentException();
}

// Стало: ...`,
      solution: `class Payment {
    double fee(double amount) { return 0; }
}

class CardPayment extends Payment {
    @Override double fee(double amount) { return amount * 0.02; }
}

class CashPayment extends Payment {
    // комиссия 0 — подходит реализация из Payment, но явно — понятнее
    @Override double fee(double amount) { return 0; }
}

class CryptoPayment extends Payment {
    @Override double fee(double amount) { return amount * 0.01 + 10; }
}

public class Main {
    static double totalFees(Payment[] payments, double amount) {
        double sum = 0;
        for (Payment p : payments) {
            sum += p.fee(amount);   // полиморфный вызов
        }
        return sum;
    }

    public static void main(String[] args) {
        Payment[] payments = { new CardPayment(), new CashPayment(), new CryptoPayment() };
        System.out.println(totalFees(payments, 1000)); // 20 + 0 + 20 = 40.0
    }
}`,
      explain: 'Новый способ оплаты = новый подкласс. Ни `totalFees`, ни другой существующий код менять не нужно — это и есть выгода полиморфизма (и принцип открытости/закрытости из урока 15).',
    },
  ],
});
