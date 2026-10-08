Trainer.add({
  id: 'java-15-oop-design',
  title: 'Java 15. Принципы проектирования: композиция и SOLID',
  subject: 'Java',
  description: 'Как связаны четыре принципа ООП, отношения между классами, композиция против наследования, SOLID с плохими и хорошими примерами, паттерны Singleton, Factory Method, Strategy, Observer и принципы DRY, KISS, YAGNI.',
  lesson: `
## Зачем нужны принципы проектирования

Программа, которая «работает», ещё не обязательно хорошая. Требования меняются постоянно: добавить способ оплаты, новый тип скидки, отправку SMS вместо e-mail. Если ради каждой мелочи приходится переписывать полпроекта и что-то ломается в неожиданном месте — дизайн плохой. Хороший дизайн — это код, который **легко менять**: изменения локальны, новое добавляется новым кодом, а не правкой старого.

Принципы из этого урока — не правила компилятора, а накопленный опыт. Их спрашивают на собеседованиях и контрольных именно потому, что они отличают «написал, и работает» от «написал так, что с этим можно жить».

## Четыре принципа ООП — как они работают вместе

| Принцип | Суть | Зачем | Средства Java |
|---|---|---|---|
| Абстракция | выделяем существенное, скрываем детали | думать о «что», а не «как» | интерфейсы, абстрактные классы |
| Инкапсуляция | данные и методы вместе, состояние скрыто | защищать инварианты | \`private\`, геттеры, валидация |
| Наследование | новый класс на основе существующего | переиспользование, иерархия типов | \`extends\`, \`implements\` |
| Полиморфизм | один интерфейс — много реализаций | код не зависит от конкретных классов | переопределение, позднее связывание |

Они не существуют по отдельности. **Абстракция** задаёт контракт (\`interface Shape { double area(); }\`). **Инкапсуляция** прячет реализацию за этим контрактом (поля \`Circle\` — \`private\`). **Наследование/реализация** создают подтипы (\`Circle implements Shape\`). **Полиморфизм** позволяет коду работать с контрактом, не зная реализации:

\`\`\`java
double total = 0;
for (Shape s : shapes) {
    total += s.area();   // какой area() вызвать — решается во время выполнения
}
\`\`\`

Все принципы ниже (SOLID, паттерны) — это способы грамотно применить эти четыре идеи.

## Отношения между классами

| Отношение | Смысл | Пример | В коде |
|---|---|---|---|
| Зависимость | «временно использует» | принтер печатает документ | параметр метода |
| Ассоциация | «знает о», долговременная связь | врач и его пациенты | поле-ссылка |
| Агрегация | «целое — часть», часть живёт сама по себе | команда и игроки | поле, объект приходит снаружи |
| Композиция | «целое — часть», часть не живёт без целого | заказ и его строки, дом и комнаты | поле, объект создаётся внутри |
| Наследование | «является» (is-a) | студент является человеком | \`extends\` |
| Реализация | «умеет», выполняет контракт | \`ArrayList\` реализует \`List\` | \`implements\` |

Агрегация и композиция — это отношения **has-a** («имеет»). Разница — в **жизненном цикле** части:

\`\`\`java
class Team {                          // агрегация: игроки приходят снаружи
    private final List<Player> players = new ArrayList<>();

    void add(Player p) { players.add(p); }  // игрок существует и без команды,
}                                           // может состоять в двух командах

class Order {                         // композиция: строки создаёт и хранит сам заказ
    private final List<OrderLine> lines = new ArrayList<>();

    void addItem(String product, int quantity, double price) {
        lines.add(new OrderLine(product, quantity, price));
    }                                 // нет заказа — нет и его строк
}
\`\`\`

> 💡 Запомни тест: «X **является** Y?» — да → наследование. «X **имеет** Y?» — да → композиция или агрегация. «Автомобиль является двигателем» — бессмыслица, значит, \`Car extends Engine\` — ошибка; правильно: в \`Car\` есть поле \`Engine\`.

## Предпочитай композицию наследованию

Наследование — самая сильная связь между классами. Потомок получает **все** публичные методы родителя (спрятать их нельзя) и зависит от деталей реализации родителя. Композиция («содержит объект и делегирует ему работу») гибче: наружу видно только то, что вы сами решили показать, а внутреннюю часть можно заменить.

**Пример 1. Стек через наследование.**

\`\`\`java
class BadStack<E> extends ArrayList<E> {
    void push(E e) { add(e); }
    E pop() { return remove(size() - 1); }
}

BadStack<String> s = new BadStack<>();
s.push("a");
s.push("b");
s.push("c");
s.add(0, "хак");      // можно! унаследованный метод ArrayList
s.remove(1);          // удаление из середины стека
System.out.println(s); // [хак, b, c] — стек больше не стек
\`\`\`

Стек — это **не** список (не is-a): у стека доступна только вершина. Наследование открыло наружу \`add(index)\`, \`remove(index)\`, \`set\` — и инвариант «работаем только с вершиной» нарушается. Кстати, ровно эту ошибку допустили в самой Java: \`java.util.Stack extends Vector\`. Поэтому сейчас для стека рекомендуют \`ArrayDeque\`.

Правильно — композиция:

\`\`\`java
class ArrayStack<E> {
    private final List<E> items = new ArrayList<>();   // стек СОДЕРЖИТ список

    public void push(E e) {
        items.add(e);
    }

    public E pop() {
        if (items.isEmpty()) {
            throw new IllegalStateException("Стек пуст");
        }
        return items.remove(items.size() - 1);
    }

    public boolean isEmpty() { return items.isEmpty(); }
    public int size() { return items.size(); }
}
\`\`\`

**Пример 2. «Хрупкий базовый класс».** Хотим считать, сколько элементов пытались добавить в множество:

\`\`\`java
class CountingSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);
    }

    int getAddCount() { return addCount; }
}

CountingSet<String> s = new CountingSet<>();
s.addAll(List.of("a", "b", "c"));
System.out.println(s.getAddCount());   // 6, а не 3!
\`\`\`

Почему 6? Унаследованный \`addAll\` внутри вызывает \`add\` для каждого элемента — а \`add\` мы переопределили, и он считает ещё раз. Мы зависим от **деталей реализации** родителя, которые нигде не обещаны и могут измениться в следующей версии. Если же \`CountingSet\` **содержит** \`HashSet\` в поле и вызывает \`set.addAll(c)\`, внутренние вызовы \`HashSet\` нас не касаются — результат 3.

Когда наследование всё-таки уместно: настоящее отношение is-a, потомок полностью соблюдает контракт родителя (см. LSP ниже), а родитель **спроектирован** для расширения (абстрактный класс, шаблонный метод).

## Связность и связанность

- **Связность (cohesion)** — насколько обязанности внутри класса относятся к одной задаче. Нужна **высокая**: класс \`Thermometer\` измеряет температуру, а не ещё и отправляет письма.
- **Связанность, или зацепление (coupling)** — насколько класс зависит от других классов и их деталей. Нужна **низкая**: изменение одного класса не должно тянуть правки в десяти других.

💡 Аналогия: хорошая команда — это специалисты (высокая связность каждого), которые общаются через понятные договорённости, а не лезут в чужую работу (низкая связанность).

> ⚠️ Подвох: русские термины легко перепутать. Запоминайте по-английски: **high cohesion, low coupling** — высокая связность, низкая связанность.

## SOLID

Пять принципов, сформулированных Робертом Мартином. Все они служат одной цели: код должен быть легко расширять и трудно сломать.

### S — Single Responsibility (единственная ответственность)

**У класса должна быть только одна причина для изменения.**

\`\`\`java
// ПЛОХО: формат отчёта, способ сохранения и отправка меняются по разным причинам
class Report {
    String toHtml() { ... }
    void saveToFile(String path) { ... }
    void sendByEmail(String address) { ... }
}
\`\`\`

Дизайнер попросил поменять вёрстку — правим \`Report\`. Перешли с файлов на базу данных — снова \`Report\`. Каждое изменение рискует сломать остальное.

\`\`\`java
// ХОРОШО: каждая обязанность — в своём классе
record Report(String title, List<String> rows) { }        // только данные

interface ReportFormatter {
    String format(Report report);
}

class HtmlFormatter implements ReportFormatter { ... }    // только оформление
class ReportSaver { void save(String content, Path path) throws IOException { ... } }
\`\`\`

### O — Open/Closed (открытость/закрытость)

**Классы должны быть открыты для расширения, но закрыты для изменения**: новое поведение добавляем новым кодом, а не правкой старого.

\`\`\`java
// ПЛОХО: каждая новая фигура — правка этого метода
class AreaCalculator {
    double area(Object shape) {
        if (shape instanceof Circle c) {
            return Math.PI * c.r * c.r;
        } else if (shape instanceof Rect r) {
            return r.w * r.h;
        }
        throw new IllegalArgumentException("Неизвестная фигура: " + shape);
    }
}
\`\`\`

\`\`\`java
// ХОРОШО: полиморфизм. Новая фигура — новый класс, калькулятор не трогаем
interface Shape {
    double area();
}

record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}

record Triangle(double base, double height) implements Shape {
    public double area() { return base * height / 2; }
}

static double totalArea(List<Shape> shapes) {
    double sum = 0;
    for (Shape s : shapes) {
        sum += s.area();
    }
    return sum;
}
// totalArea(List.of(new Rectangle(2, 3), new Triangle(4, 5))) → 16.0
\`\`\`

> 💡 Запомни: цепочка \`if (x instanceof A) ... else if (x instanceof B) ...\` по типам — типичный признак нарушения OCP. Лечится переносом поведения в сами классы.

### L — Liskov Substitution (подстановка Барбары Лисков)

**Объект подкласса должен работать везде, где ожидается объект базового класса, не ломая программу.** Наследник может расширять поведение, но не нарушать обещания родителя: не усиливать требования к входным данным, не ослаблять гарантии результата, не бросать новых checked-исключений (вспомните урок 13).

Классический пример — «квадрат является прямоугольником»:

\`\`\`java
class Rectangle {
    protected int width, height;

    void setWidth(int w) { width = w; }
    void setHeight(int h) { height = h; }
    int area() { return width * height; }
}

class Square extends Rectangle {
    @Override
    void setWidth(int w) { width = w; height = w; }   // квадрат держит стороны равными

    @Override
    void setHeight(int h) { width = h; height = h; }
}

static void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    System.out.println(r.area());   // автор метода уверен: будет 20
}

resize(new Rectangle());   // 20
resize(new Square());      // 16 — подстановка сломала логику
\`\`\`

В геометрии квадрат — прямоугольник, но **по поведению** изменяемый квадрат не может выполнить обещание «ширина и высота меняются независимо». Решения: не связывать их наследованием (оба реализуют \`Shape\` с \`area()\`) или сделать фигуры неизменяемыми. Другие признаки нарушения LSP: метод наследника бросает \`UnsupportedOperationException\` («пингвин — птица, но \`fly()\` не умеет»), или вызывающему коду приходится проверять \`instanceof\`, чтобы обойти особенности подкласса.

### I — Interface Segregation (разделение интерфейсов)

**Клиенты не должны зависеть от методов, которыми не пользуются.** Лучше несколько маленьких интерфейсов, чем один «толстый».

\`\`\`java
// ПЛОХО: простой принтер вынужден «реализовывать» то, чего не умеет
interface MultiFunctionDevice {
    void print(String doc);
    void scan(String doc);
    void fax(String doc, String number);
}

class SimplePrinter implements MultiFunctionDevice {
    public void print(String doc) { System.out.println("Печатаю " + doc); }
    public void scan(String doc) { throw new UnsupportedOperationException("Не умею сканировать"); }
    public void fax(String doc, String number) { throw new UnsupportedOperationException("Не умею отправлять факс"); }
}
\`\`\`

\`\`\`java
// ХОРОШО: маленькие интерфейсы, класс реализует только то, что умеет
interface Printer { void print(String doc); }
interface Scanner { void scan(String doc); }
interface Fax { void fax(String doc, String number); }

class SimplePrinter implements Printer { ... }
class OfficeMachine implements Printer, Scanner, Fax { ... }
\`\`\`

Обратите внимание: «толстый» интерфейс заодно провоцирует нарушение LSP — заглушки с исключениями.

### D — Dependency Inversion (инверсия зависимостей)

**Модули верхнего уровня не должны зависеть от модулей нижнего уровня; оба зависят от абстракций.** Бизнес-логика не должна знать, MySQL у вас или файл.

\`\`\`java
// ПЛОХО: сервис намертво привязан к конкретной базе
class OrderService {
    private final MySqlOrderRepository repository = new MySqlOrderRepository();
}
\`\`\`

Сменить базу или протестировать сервис без настоящей базы невозможно — надо править \`OrderService\`.

\`\`\`java
// ХОРОШО: зависимость от интерфейса + внедрение через конструктор
interface OrderRepository {
    void save(String order);
    List<String> findAll();
}

class InMemoryOrderRepository implements OrderRepository {
    private final List<String> orders = new ArrayList<>();

    @Override
    public void save(String order) { orders.add(order); }

    @Override
    public List<String> findAll() { return List.copyOf(orders); }
}

class OrderService {
    private final OrderRepository repository;

    OrderService(OrderRepository repository) {   // внедрение зависимости (dependency injection)
        this.repository = repository;
    }

    void place(String order) {
        if (order.isBlank()) {
            throw new IllegalArgumentException("Пустой заказ");
        }
        repository.save(order);
    }
}

OrderRepository repo = new InMemoryOrderRepository();
OrderService service = new OrderService(repo);
service.place("Книга");
service.place("Лампа");
System.out.println(repo.findAll());   // [Книга, Лампа]
\`\`\`

Теперь \`OrderService\` не знает, где хранятся заказы: в тестах передаём \`InMemoryOrderRepository\`, в продакшене — реализацию для базы данных. **Внедрение зависимостей** (передать зависимость снаружи, а не создавать внутри через \`new\`) — основной способ выполнить DIP.

## Паттерны проектирования

Паттерн — типовое решение типовой задачи, у которого есть общепринятое имя. Сказать «тут Стратегия» быстрее, чем объяснять схему классов.

### Singleton (Одиночка)

Гарантирует, что у класса **ровно один** объект, и даёт к нему глобальную точку доступа.

\`\`\`java
class AppConfig {
    private static final AppConfig INSTANCE = new AppConfig();  // создаётся при загрузке класса

    private String theme = "светлая";

    private AppConfig() { }                 // никто снаружи не сделает new AppConfig()

    public static AppConfig getInstance() {
        return INSTANCE;
    }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
}

AppConfig.getInstance().setTheme("тёмная");
System.out.println(AppConfig.getInstance().getTheme());  // тёмная — объект один
\`\`\`

Самый простой и надёжный вариант — enum: \`enum Settings { INSTANCE; ... }\`. Минусы синглтона: это глобальное состояние, скрытые зависимости, трудно подменить в тестах. Часто лучше создать один объект и **передать** его через конструктор (DIP).

### Factory Method (Фабричный метод)

Создание объекта выносится в отдельный метод, чтобы клиент не зависел от конкретных классов. Простейшая форма — статическая фабрика:

\`\`\`java
class NotificationFactory {
    static Notification create(String channel) {
        return switch (channel) {
            case "email" -> new EmailNotification();
            case "sms" -> new SmsNotification();
            default -> throw new IllegalArgumentException("Неизвестный канал: " + channel);
        };
    }
}

Notification n = NotificationFactory.create("sms");
n.send("Заказ готов");   // SMS: Заказ готов
\`\`\`

Классический вариант (GoF): базовый класс объявляет абстрактный метод создания, а подклассы решают, **какой** объект создать:

\`\`\`java
abstract class Logistics {
    abstract Transport createTransport();     // фабричный метод

    void planDelivery() {
        System.out.println("Планируем доставку");
        Transport t = createTransport();       // не знаем, какой именно транспорт
        t.deliver();
    }
}

class RoadLogistics extends Logistics {
    @Override
    Transport createTransport() { return new Truck(); }
}

class SeaLogistics extends Logistics {
    @Override
    Transport createTransport() { return new Ship(); }
}

new SeaLogistics().planDelivery();
// Планируем доставку
// Везём кораблём
\`\`\`

### Strategy (Стратегия)

Семейство взаимозаменяемых алгоритмов, каждый — в своём классе за общим интерфейсом. Объект получает стратегию и делегирует ей работу; стратегию можно менять на ходу. Это OCP и композиция в действии.

\`\`\`java
interface DiscountStrategy {
    double apply(double price);
}

class NoDiscount implements DiscountStrategy {
    @Override
    public double apply(double price) { return price; }
}

class PercentDiscount implements DiscountStrategy {
    private final double percent;

    PercentDiscount(double percent) { this.percent = percent; }

    @Override
    public double apply(double price) { return price * (100 - percent) / 100; }
}

class Checkout {
    private DiscountStrategy discount = new NoDiscount();

    void setDiscount(DiscountStrategy discount) { this.discount = discount; }

    double total(double price) { return discount.apply(price); }
}

Checkout checkout = new Checkout();
System.out.println(checkout.total(1000));                 // 1000.0
checkout.setDiscount(new PercentDiscount(10));
System.out.println(checkout.total(1000));                 // 900.0
checkout.setDiscount(price -> price > 500 ? price - 200 : price);  // стратегия-лямбда
System.out.println(checkout.total(1000));                 // 800.0
\`\`\`

Интерфейс с одним абстрактным методом — функциональный, поэтому стратегию можно задать лямбдой. \`Comparator\` в \`list.sort(...)\` — тоже стратегия.

### Observer (Наблюдатель)

Объект-издатель хранит список подписчиков и оповещает их о событии. Издатель не знает, кто именно подписан и что они делают, — связанность минимальна.

\`\`\`java
interface OrderListener {
    void onOrderPlaced(String order);
}

class OrderPublisher {
    private final List<OrderListener> listeners = new ArrayList<>();

    void subscribe(OrderListener listener) {
        listeners.add(listener);
    }

    void placeOrder(String order) {
        System.out.println("Заказ оформлен: " + order);
        for (OrderListener listener : listeners) {
            listener.onOrderPlaced(order);
        }
    }
}

OrderPublisher shop = new OrderPublisher();
shop.subscribe(order -> System.out.println("Склад: собрать " + order));
shop.subscribe(order -> System.out.println("Почта: письмо про " + order));
shop.placeOrder("ноутбук");
// Заказ оформлен: ноутбук
// Склад: собрать ноутбук
// Почта: письмо про ноутбук
\`\`\`

Так устроены обработчики событий в интерфейсах: кнопка не знает, что произойдёт по нажатию, — она просто оповещает слушателей.

## DRY, KISS, YAGNI

- **DRY** (Don't Repeat Yourself) — не повторяйся. Одно знание — в одном месте. Скопировали проверку e-mail в пять классов — при изменении правила поправите четыре и забудете пятый. Вынесите в метод или класс.
- **KISS** (Keep It Simple, Stupid) — делай проще. Из двух работающих решений выбирайте понятное. Три паттерна там, где хватит одного \`if\`, — не профессионализм, а усложнение.
- **YAGNI** (You Aren't Gonna Need It) — тебе это не понадобится. Не пишите код «на будущее», пока в нём нет реальной потребности: он стоит времени, усложняет проект и часто так и не пригождается.

> ⚠️ Подвох: принципы — не догма. SOLID ради SOLID нарушает KISS. Интерфейс с единственной реализацией, которую никто не собирается менять, — часто лишний. Применяйте принцип, когда видите проблему, которую он решает.

## Шпаргалка

| Принцип | Коротко | Признак нарушения |
|---|---|---|
| SRP | одна причина для изменения | класс и считает, и печатает, и сохраняет |
| OCP | расширяем, не изменяя | цепочки \`instanceof\` / \`switch\` по типам |
| LSP | подтип заменяет базовый тип | наследник бросает \`UnsupportedOperationException\`, квадрат-прямоугольник |
| ISP | маленькие интерфейсы | пустые методы и заглушки |
| DIP | зависеть от абстракций | \`new КонкретныйКласс()\` внутри бизнес-логики |
| Композиция | has-a, делегирование | \`extends\` ради переиспользования кода, а не is-a |
| Singleton | один объект | приватный конструктор + \`static\` экземпляр |
| Factory Method | создание — в отдельном методе | — |
| Strategy | взаимозаменяемые алгоритмы | — |
| Observer | подписка на события | — |
| DRY / KISS / YAGNI | не повторяйся / проще / не делай впрок | — |
`,
  tasks: [
    {
      type: 'match',
      q: 'Соедините принцип SOLID и его формулировку',
      pairs: [
        ['S — Single Responsibility', 'у класса одна причина для изменения'],
        ['O — Open/Closed', 'расширяем поведение новым кодом, не меняя старый'],
        ['L — Liskov Substitution', 'объект подкласса можно подставить вместо базового без поломок'],
        ['I — Interface Segregation', 'много маленьких интерфейсов лучше одного «толстого»'],
        ['D — Dependency Inversion', 'зависеть от абстракций, а не от конкретных классов'],
      ],
    },
    {
      type: 'match',
      q: 'Соедините отношение между классами и пример',
      pairs: [
        ['Наследование (is-a)', '`Student extends Person`: студент является человеком'],
        ['Композиция', 'заказ сам создаёт свои строки, без заказа они не существуют'],
        ['Агрегация', 'команда хранит игроков, созданных снаружи; игрок может перейти в другую команду'],
        ['Зависимость', 'метод `print(Document d)` получает документ только на время вызова'],
        ['Реализация', '`ArrayList implements List`'],
      ],
    },
    {
      type: 'choice',
      q: 'Какое объявление класса **ошибочно с точки зрения проектирования**, хотя и компилируется?',
      options: [
        '`class Car extends Engine { ... }`',
        '`class Car { private final Engine engine; ... }`',
        '`class SportsCar extends Car { ... }`',
        '`class Car implements Comparable<Car> { ... }`',
      ],
      answer: '`class Car extends Engine { ... }`',
      explain: 'Тест «является ли?»: автомобиль не является двигателем — он его **имеет**. Здесь нужна композиция: поле `Engine` внутри `Car`. Спортивный автомобиль является автомобилем — наследование уместно.',
    },
    {
      type: 'choice',
      q: 'Что выведет код и в чём проблема класса?\n```java\nclass BadStack<E> extends ArrayList<E> {\n    void push(E e) { add(e); }\n    E pop() { return remove(size() - 1); }\n}\n\nBadStack<Integer> stack = new BadStack<>();\nstack.push(1);\nstack.push(2);\nstack.push(3);\nstack.add(0, 99);\nstack.set(2, 0);\nSystem.out.println(stack.pop() + " " + stack);\n```',
      options: [
        '`3 [99, 1, 0]` — через унаследованные методы можно менять середину стека',
        '`3 [1, 2]` — `add(0, 99)` и `set` для стека игнорируются',
        'Ошибка компиляции: у стека нет метода `add(int, E)`',
        '`0 [99, 1, 3]` — `pop` берёт элемент с индексом 2',
      ],
      answer: '`3 [99, 1, 0]` — через унаследованные методы можно менять середину стека',
      explain: 'После `push` — `[1, 2, 3]`, `add(0, 99)` → `[99, 1, 2, 3]`, `set(2, 0)` → `[99, 1, 0, 3]`, `pop()` снимает `3`. Наследование от `ArrayList` открыло наружу все методы списка, и инвариант стека не защищён. Правильно — композиция: стек **содержит** список в `private`-поле.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass CountingSet<E> extends HashSet<E> {\n    private int addCount = 0;\n\n    @Override\n    public boolean add(E e) {\n        addCount++;\n        return super.add(e);\n    }\n\n    @Override\n    public boolean addAll(Collection<? extends E> c) {\n        addCount += c.size();\n        return super.addAll(c);\n    }\n\n    int getAddCount() { return addCount; }\n}\n\nCountingSet<String> set = new CountingSet<>();\nset.addAll(List.of("a", "b", "a"));\nSystem.out.println(set.getAddCount() + " " + set.size());\n```',
      answer: ['6 2'],
      hint: 'Как реализован унаследованный `addAll` внутри `HashSet`?',
      explain: '`addAll` прибавляет 3, а затем `super.addAll` внутри вызывает `add` для каждого из трёх элементов — и наш переопределённый `add` прибавляет ещё 3. Итого 6. В множестве два различных элемента. Это проблема «хрупкого базового класса»: наследник зависит от деталей реализации родителя. С композицией (поле `Set<E>`) счётчик был бы 3.',
    },
    {
      type: 'choice',
      q: 'Какие утверждения о композиции и наследовании **верны**?',
      options: [
        'При наследовании потомок получает все публичные методы родителя, и скрыть их нельзя',
        'Композиция позволяет заменить внутреннюю часть, не меняя интерфейс класса',
        'Наследование уместно, когда есть настоящее отношение is-a и потомок соблюдает контракт родителя',
        'Композиция всегда хуже, потому что требует писать методы-делегаты',
        'Наследование — единственный способ переиспользовать код в Java',
      ],
      answer: [
        'При наследовании потомок получает все публичные методы родителя, и скрыть их нельзя',
        'Композиция позволяет заменить внутреннюю часть, не меняя интерфейс класса',
        'Наследование уместно, когда есть настоящее отношение is-a и потомок соблюдает контракт родителя',
      ],
      explain: 'Методы-делегаты — небольшая плата за гибкость и защиту инвариантов. Переиспользовать код можно и композицией, и вынесением в отдельные классы.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass Rectangle {\n    protected int width, height;\n\n    void setWidth(int w) { width = w; }\n    void setHeight(int h) { height = h; }\n    int area() { return width * height; }\n}\n\nclass Square extends Rectangle {\n    @Override\n    void setWidth(int w) { width = w; height = w; }\n\n    @Override\n    void setHeight(int h) { width = h; height = h; }\n}\n\npublic class Main {\n    static int stretch(Rectangle r) {\n        r.setHeight(3);\n        r.setWidth(6);\n        return r.area();\n    }\n\n    public static void main(String[] args) {\n        System.out.println(stretch(new Rectangle()) + " " + stretch(new Square()));\n    }\n}\n```',
      answer: ['18 36'],
      explain: 'Для прямоугольника 3 × 6 = 18. У квадрата последний вызов `setWidth(6)` делает обе стороны равными 6 → 36. Метод `stretch` рассчитан на независимые стороны, и подстановка `Square` ломает его логику.',
    },
    {
      type: 'choice',
      q: 'Какой принцип нарушает пара `Square extends Rectangle` из предыдущего задания?',
      options: [
        'LSP — принцип подстановки Лисков',
        'SRP — принцип единственной ответственности',
        'ISP — принцип разделения интерфейсов',
        'DIP — принцип инверсии зависимостей',
      ],
      answer: 'LSP — принцип подстановки Лисков',
      explain: 'Объект `Square` нельзя безопасно подставить туда, где ожидается `Rectangle`: нарушается обещание родителя «ширина и высота меняются независимо». Наследование корректно, только когда подкласс сохраняет поведение базового класса, а не просто «похож в жизни».',
    },
    {
      type: 'choice',
      q: 'Какой принцип SOLID нарушает этот класс?\n```java\nclass Invoice {\n    double calculateTotal() { ... }\n    String toPdf() { ... }\n    void saveToDatabase() { ... }\n    void sendToClient(String email) { ... }\n}\n```',
      options: [
        'SRP: у класса несколько причин для изменения',
        'LSP: класс нельзя подставить вместо родителя',
        'ISP: интерфейс слишком маленький',
        'Ничего не нарушает: всё, что касается счёта, должно быть в одном классе',
      ],
      answer: 'SRP: у класса несколько причин для изменения',
      explain: 'Расчёт, формат PDF, хранение и отправка меняются по разным причинам и, скорее всего, по просьбе разных людей. Правильно разделить: `Invoice` (данные и расчёт), `InvoicePdfFormatter`, `InvoiceRepository`, `InvoiceSender`.',
    },
    {
      type: 'choice',
      q: 'Какой принцип нарушает этот код и как его исправить?\n```java\nclass SalaryCalculator {\n    double salary(Employee e) {\n        if (e instanceof Manager m) {\n            return m.getBase() * 1.5;\n        } else if (e instanceof Developer d) {\n            return d.getBase() + d.getBonus();\n        }\n        return e.getBase();\n    }\n}\n```',
      options: [
        'OCP: добавить в `Employee` метод `salary()` и переопределить его в подклассах',
        'SRP: разнести `Manager` и `Developer` по разным пакетам',
        'ISP: разделить `Employee` на два интерфейса',
        'Ничего не нарушено: `instanceof` с pattern matching — современный стиль',
      ],
      answer: 'OCP: добавить в `Employee` метод `salary()` и переопределить его в подклассах',
      explain: 'Каждый новый тип сотрудника требует правки `SalaryCalculator` — класс не закрыт для изменений. Полиморфизм решает это: новый подкласс просто переопределяет `salary()`, остальной код не меняется.',
    },
    {
      type: 'choice',
      q: 'Класс `SimplePrinter` реализует интерфейс с методами `print`, `scan` и `fax`, а в `scan` и `fax` пишет `throw new UnsupportedOperationException()`. Какие принципы здесь страдают?',
      options: [
        'ISP — интерфейс слишком «толстый»',
        'LSP — объект не выполняет контракт своего типа',
        'DRY — повторяется код',
        'YAGNI — написан лишний код на будущее',
      ],
      answer: ['ISP — интерфейс слишком «толстый»', 'LSP — объект не выполняет контракт своего типа'],
      explain: 'Принтер вынужден зависеть от методов, которые ему не нужны (ISP), а код, получивший `MultiFunctionDevice`, вправе вызвать `scan` — и получит исключение (LSP). Решение — разделить на `Printer`, `Scanner`, `Fax`.',
    },
    {
      type: 'choice',
      q: 'Как лучше переписать класс, чтобы его можно было протестировать без настоящей базы данных?\n```java\nclass OrderService {\n    private final MySqlOrderRepository repository = new MySqlOrderRepository();\n\n    void place(String order) {\n        repository.save(order);\n    }\n}\n```',
      options: [
        'Ввести интерфейс `OrderRepository` и передавать реализацию в конструктор `OrderService`',
        'Сделать `MySqlOrderRepository` синглтоном и вызывать `getInstance()`',
        'Унаследовать `OrderService` от `MySqlOrderRepository`',
        'Сделать поле `repository` публичным, чтобы тест мог его заменить',
      ],
      answer: 'Ввести интерфейс `OrderRepository` и передавать реализацию в конструктор `OrderService`',
      explain: 'Это DIP + внедрение зависимости. Синглтон оставляет ту же жёсткую зависимость, только глобальную. Наследование здесь бессмысленно (сервис не является репозиторием). Публичное поле ломает инкапсуляцию.',
    },
    {
      type: 'choice',
      q: 'Какой вариант описывает **высокую связность и низкую связанность** (high cohesion, low coupling)?',
      options: [
        'Класс `Cart` занимается только товарами корзины и общается с оплатой через интерфейс `PaymentMethod`',
        'Класс `Cart` хранит товары, сам считает налоги, отправляет письма и создаёт `new SberbankApi()`',
        'Все поля всех классов `public`, чтобы классы могли свободно читать данные друг друга',
        'Один класс `Shop` на 3000 строк, чтобы не было зависимостей между классами',
      ],
      answer: 'Класс `Cart` занимается только товарами корзины и общается с оплатой через интерфейс `PaymentMethod`',
      explain: 'Связность — сосредоточенность класса на одной задаче; связанность — зависимость от других классов. Публичные поля и `new` конкретных классов повышают связанность, а «класс-бог» — это низкая связность.',
    },
    {
      type: 'gaps',
      q: 'Допишите класс-одиночку (Singleton)',
      code: true,
      caseSensitive: true,
      text: 'class Logger {\n    private [static] final Logger INSTANCE = new Logger();\n\n    [private] Logger() { }\n\n    public [static] Logger getInstance() {\n        return [INSTANCE];\n    }\n\n    public void log(String msg) {\n        System.out.println("\\[LOG] " + msg);\n    }\n}',
      explain: 'Приватный конструктор запрещает `new Logger()` снаружи (ошибка компиляции «Logger() has private access»). Статическое поле хранит единственный экземпляр, статический метод даёт к нему доступ без создания объекта.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nclass Counter {\n    private static final Counter INSTANCE = new Counter();\n    private int value;\n\n    private Counter() { }\n\n    static Counter getInstance() { return INSTANCE; }\n\n    int next() { return ++value; }\n}\n\nCounter a = Counter.getInstance();\nCounter b = Counter.getInstance();\na.next();\nb.next();\nSystem.out.println((a == b) + " " + a.next());\n```',
      answer: ['true 3'],
      explain: '`a` и `b` ссылаются на один и тот же объект, поэтому `a == b` — `true`, а счётчик общий: два вызова `next()` дали 2, третий возвращает 3.',
    },
    {
      type: 'gaps',
      q: 'Допишите паттерн «Стратегия»: корзина не знает, как именно происходит оплата',
      code: true,
      caseSensitive: true,
      text: 'interface PaymentMethod {\n    void pay(double amount);\n}\n\nclass CardPayment [implements] PaymentMethod {\n    @Override\n    public void pay(double amount) {\n        System.out.println("Оплата картой: " + amount);\n    }\n}\n\nclass Cart {\n    private final [PaymentMethod] payment;\n\n    Cart(PaymentMethod payment) {\n        [this].payment = payment;\n    }\n\n    void checkout(double total) {\n        payment.[pay](total);\n    }\n}',
      explain: 'Поле имеет тип **интерфейса**, а конкретная стратегия приходит через конструктор. Добавить оплату по QR-коду — новый класс, `Cart` не меняется (OCP). Можно передать и лямбду: `new Cart(x -> System.out.println("СБП: " + x))`.',
    },
    {
      type: 'input',
      q: 'Что выведет код? (Учитывается регистр.)\n```java\ninterface TextFormatter {\n    String format(String s);\n}\n\nclass Editor {\n    private TextFormatter formatter = s -> s;\n\n    void setFormatter(TextFormatter formatter) { this.formatter = formatter; }\n\n    void publish(String text) { System.out.print(formatter.format(text) + " "); }\n}\n\nEditor e = new Editor();\ne.publish("Java");\ne.setFormatter(String::toUpperCase);\ne.publish("Java");\ne.setFormatter(s -> s.repeat(2));\ne.publish("Java");\n```',
      answer: ['Java JAVA JavaJava'],
      caseSensitive: true,
      explain: 'Это «Стратегия»: `Editor` делегирует форматирование объекту, который можно заменить на ходу. Сначала стратегия «как есть», затем ссылка на метод `toUpperCase`, затем лямбда с `repeat(2)`.',
    },
    {
      type: 'order',
      q: 'Расставьте строки вывода в правильном порядке (паттерн «Наблюдатель»)\n```java\nThermometer th = new Thermometer();   // setTemperature оповещает подписчиков по порядку подписки\nth.subscribe(t -> System.out.println("Экран: " + t));\nth.subscribe(t -> {\n    if (t > 30) {\n        System.out.println("Тревога: " + t);\n    }\n});\nth.setTemperature(25);\nth.setTemperature(35);\n```',
      items: ['Экран: 25', 'Экран: 35', 'Тревога: 35'],
      join: '\n',
      explain: 'При каждом изменении термометр обходит список подписчиков в порядке подписки. При 25 градусах второй подписчик ничего не печатает, при 35 — печатают оба.',
    },
    {
      type: 'input',
      q: 'Что выведет код? (Паттерн «Фабричный метод»)\n```java\ninterface Button { String render(); }\n\nclass WindowsButton implements Button {\n    public String render() { return "[Win]"; }\n}\n\nclass WebButton implements Button {\n    public String render() { return "<web>"; }\n}\n\nabstract class Dialog {\n    abstract Button createButton();\n\n    String show() { return "Диалог " + createButton().render(); }\n}\n\nclass WindowsDialog extends Dialog {\n    Button createButton() { return new WindowsButton(); }\n}\n\nclass WebDialog extends Dialog {\n    Button createButton() { return new WebButton(); }\n}\n\nDialog d = new WebDialog();\nSystem.out.println(d.show());\n```',
      answer: ['Диалог <web>'],
      explain: 'Метод `show()` написан в базовом классе и не знает, какую кнопку получит. `createButton()` — фабричный метод: его вызов динамически связывается с реализацией в `WebDialog`.',
    },
    {
      type: 'match',
      q: 'Соедините паттерн и задачу, которую он решает',
      pairs: [
        ['Singleton', 'у класса должен быть ровно один объект с глобальным доступом'],
        ['Factory Method', 'клиент получает объект, не зная его конкретного класса'],
        ['Strategy', 'нужно подменять алгоритм (скидку, сортировку) во время работы'],
        ['Observer', 'несколько объектов должны узнавать о событии в другом объекте'],
      ],
    },
    {
      type: 'match',
      q: 'Соедините ситуацию и принцип, который она нарушает',
      pairs: [
        ['Одна и та же проверка e-mail скопирована в пять классов', 'DRY'],
        ['Для вывода «Привет» написаны фабрика, стратегия и три интерфейса', 'KISS'],
        ['Добавили поддержку десяти валют «на всякий случай», хотя магазин работает только в рублях', 'YAGNI'],
        ['Сервис внутри себя делает `new PostgresDatabase()`', 'DIP'],
      ],
    },
    {
      type: 'flashcard',
      front: 'Сформулируйте **принцип подстановки Лисков (LSP)** и приведите пример нарушения.',
      back: 'Объекты подкласса должны работать везде, где ожидается базовый класс, **не нарушая корректность программы**: наследник не усиливает требования к входу, не ослабляет гарантии результата, не бросает новых checked-исключений.\n\nНарушение: `Square extends Rectangle` с изменяемыми сторонами — после `setWidth(5); setHeight(4)` площадь 16, а не 20. Ещё пример: `Penguin extends Bird`, где `fly()` бросает `UnsupportedOperationException`.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Что такое **принцип инверсии зависимостей (DIP)** и как его реализуют?',
      back: 'Модули верхнего уровня (бизнес-логика) не зависят от модулей нижнего уровня (база, сеть, файлы) — **оба зависят от абстракций** (интерфейсов).\n\nРеализация: поле типа интерфейса + **внедрение зависимости через конструктор**: `OrderService(OrderRepository repo)`. Тогда реализацию легко заменить, а в тестах — подставить заглушку.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Чем **композиция** отличается от **агрегации**?',
      back: 'Обе — отношение «целое — часть» (has-a). При **композиции** часть принадлежит целому и не существует без него: заказ сам создаёт свои строки, дом — комнаты. При **агрегации** часть существует независимо и может принадлежать нескольким целым: команда и игроки, которых передали снаружи.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Есть плохой класс:\n```java\nclass Playlist extends ArrayList<String> { }\n```\nЧерез него можно добавить дубликаты, пустые названия и вообще что угодно. Перепишите `Playlist` через **композицию**:\n- конструктор принимает название плейлиста;\n- `boolean add(String song)` — не добавляет `null`, пустые строки и дубликаты (возвращает `false`);\n- `String next()` — возвращает песни по кругу; для пустого плейлиста — `IllegalStateException`;\n- `int size()` и `List<String> getSongs()`, который не позволяет изменить внутренний список снаружи.',
      starter: `import java.util.ArrayList;
import java.util.List;

class Playlist {
    // ваш код
}

public class Main {
    public static void main(String[] args) {
        Playlist p = new Playlist("Дорога");
        p.add("Song A");
        p.add("Song B");
        System.out.println(p.add("Song A"));   // false
        System.out.println(p.next() + ", " + p.next() + ", " + p.next());
        System.out.println(p.size() + " " + p.getSongs());
    }
}`,
      solution: `import java.util.ArrayList;
import java.util.List;

class Playlist {
    private final String name;
    private final List<String> songs = new ArrayList<>();   // композиция
    private int current = 0;

    public Playlist(String name) {
        this.name = name;
    }

    public boolean add(String song) {
        if (song == null || song.isBlank() || songs.contains(song)) {
            return false;
        }
        songs.add(song);
        return true;
    }

    public String next() {
        if (songs.isEmpty()) {
            throw new IllegalStateException("Плейлист «" + name + "» пуст");
        }
        String song = songs.get(current);
        current = (current + 1) % songs.size();
        return song;
    }

    public int size() {
        return songs.size();
    }

    public List<String> getSongs() {
        return List.copyOf(songs);   // наружу — неизменяемая копия
    }
}

public class Main {
    public static void main(String[] args) {
        Playlist p = new Playlist("Дорога");
        p.add("Song A");
        p.add("Song B");
        System.out.println(p.add("Song A"));            // false — дубликат
        System.out.println(p.next() + ", " + p.next() + ", " + p.next());
        System.out.println(p.size() + " " + p.getSongs());
        try {
            p.getSongs().add("Взлом");
        } catch (UnsupportedOperationException e) {
            System.out.println("Изменить список снаружи нельзя");
        }
    }
}
// выведет:
// false
// Song A, Song B, Song A
// 2 [Song A, Song B]
// Изменить список снаружи нельзя`,
      explain: 'Плейлист **содержит** список и сам решает, какие операции открыть. Инварианты (нет дубликатов и пустых строк) защищены: обойти `add` невозможно, а `getSongs()` отдаёт неизменяемую копию.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Перепишите расчёт доставки с помощью паттерна **Стратегия**, чтобы новый способ доставки добавлялся без изменения класса `Order`:\n```java\ndouble deliveryCost(String type, double weightKg) {\n    if (type.equals("courier")) return 300 + 50 * weightKg;\n    else if (type.equals("pickup")) return 0;\n    else throw new IllegalArgumentException(type);\n}\n```\nСоздайте интерфейс `DeliveryStrategy` с методом `double cost(double weightKg)`, классы `CourierDelivery` и `PickupDelivery`, класс `Order` (вес + стратегия, метод `deliveryCost()`, возможность сменить стратегию). Добавьте «Почту» (`150 + 30 * вес`) **лямбдой**, не создавая класса. Проверьте на заказе весом 2 кг.',
      starter: `interface DeliveryStrategy {
    double cost(double weightKg);
}

// CourierDelivery, PickupDelivery, Order

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `interface DeliveryStrategy {
    double cost(double weightKg);
}

class CourierDelivery implements DeliveryStrategy {
    @Override
    public double cost(double weightKg) {
        return 300 + 50 * weightKg;
    }
}

class PickupDelivery implements DeliveryStrategy {
    @Override
    public double cost(double weightKg) {
        return 0;
    }
}

class Order {
    private final double weightKg;
    private DeliveryStrategy delivery;

    Order(double weightKg, DeliveryStrategy delivery) {
        this.weightKg = weightKg;
        this.delivery = delivery;
    }

    void setDelivery(DeliveryStrategy delivery) {
        this.delivery = delivery;
    }

    double deliveryCost() {
        return delivery.cost(weightKg);
    }
}

public class Main {
    public static void main(String[] args) {
        Order order = new Order(2, new CourierDelivery());
        System.out.println(order.deliveryCost());          // 400.0
        order.setDelivery(new PickupDelivery());
        System.out.println(order.deliveryCost());          // 0.0
        order.setDelivery(w -> 150 + 30 * w);              // «Почта» — новая стратегия лямбдой
        System.out.println(order.deliveryCost());          // 210.0
    }
}`,
      hint: '`DeliveryStrategy` — функциональный интерфейс (один абстрактный метод), поэтому его можно реализовать лямбдой `w -> ...`.',
      explain: 'Цепочка `if` по строке-типу заменена полиморфизмом: `Order` зависит только от интерфейса, а новые способы доставки — это новые реализации (OCP). Строка с опечаткой `"curier"` больше невозможна — ошибки ловит компилятор.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Реализуйте **DIP**: класс `NotificationService` с методом `notifyUser(String user, String text)`, который отправляет сообщение `Здравствуйте, <user>! <text>`, но **не знает**, как именно оно отправляется.\n- интерфейс `MessageSender` с методом `send(String to, String text)`;\n- реализации `EmailSender` и `SmsSender` (печатают `Email для <to>: <text>` / `SMS для <to>: <text>`);\n- `FakeSender` для тестов: ничего не печатает, а сохраняет сообщения в список;\n- зависимость передаётся через конструктор.\n\nВ `main` покажите все три варианта.',
      starter: `import java.util.ArrayList;
import java.util.List;

interface MessageSender {
    void send(String to, String text);
}

// EmailSender, SmsSender, FakeSender, NotificationService

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `import java.util.ArrayList;
import java.util.List;

interface MessageSender {
    void send(String to, String text);
}

class EmailSender implements MessageSender {
    @Override
    public void send(String to, String text) {
        System.out.println("Email для " + to + ": " + text);
    }
}

class SmsSender implements MessageSender {
    @Override
    public void send(String to, String text) {
        System.out.println("SMS для " + to + ": " + text);
    }
}

class FakeSender implements MessageSender {        // для тестов: ничего не отправляет, только запоминает
    private final List<String> sent = new ArrayList<>();

    @Override
    public void send(String to, String text) {
        sent.add(to + ": " + text);
    }

    List<String> getSent() {
        return sent;
    }
}

class NotificationService {
    private final MessageSender sender;

    NotificationService(MessageSender sender) {
        this.sender = sender;
    }

    void notifyUser(String user, String text) {
        sender.send(user, "Здравствуйте, " + user + "! " + text);
    }
}

public class Main {
    public static void main(String[] args) {
        new NotificationService(new EmailSender()).notifyUser("Анна", "Заказ отправлен.");
        new NotificationService(new SmsSender()).notifyUser("Олег", "Код: 1234.");

        FakeSender fake = new FakeSender();
        NotificationService service = new NotificationService(fake);
        service.notifyUser("Тест", "Проверка.");
        System.out.println(fake.getSent());
    }
}
// выведет:
// Email для Анна: Здравствуйте, Анна! Заказ отправлен.
// SMS для Олег: Здравствуйте, Олег! Код: 1234.
// [Тест: Здравствуйте, Тест! Проверка.]`,
      explain: '`NotificationService` (верхний уровень) и `EmailSender`/`SmsSender` (нижний уровень) зависят от абстракции `MessageSender`. Благодаря внедрению через конструктор сервис можно проверить с `FakeSender`, ничего реально не отправляя.',
    },
  ],
});
