Trainer.add({
  id: 'java-12-nested-enums',
  title: 'Java 12. Вложенные классы, enum и record',
  subject: 'Java',
  description: 'Статические вложенные, внутренние, локальные и анонимные классы, захват effectively final переменных, лямбды вместо анонимных классов; перечисления enum с полями и методами; record с компактным конструктором.',
  lesson: `## Зачем объявлять класс внутри класса

Иногда класс нужен только как часть другого: элемент заказа существует лишь внутри заказа, «строитель» нужен лишь для создания одного конкретного объекта, итератор работает только со своей коллекцией. Вложенные классы позволяют:
- **сгруппировать** связанный код в одном месте;
- **спрятать** вспомогательный класс (\`private\`) от остального мира;
- дать вспомогательному классу доступ к \`private\`-членам внешнего класса.

| Вид | Где объявлен | Связь с объектом внешнего класса |
|---|---|---|
| Статический вложенный (static nested) | в теле класса, с \`static\` | нет |
| Внутренний (inner) | в теле класса, без \`static\` | есть: знает «свой» внешний объект |
| Локальный | внутри метода | есть (если метод нестатический) |
| Анонимный | в выражении \`new Тип() { ... }\` | есть (если создан в нестатическом контексте) |

## Статические вложенные классы

Это обычный класс, который просто «живёт» внутри другого — как инструкция, вложенная в коробку с прибором: относится к прибору, но читать её можно и без него. Объект внешнего класса для создания не нужен. Классический пример — паттерн **Builder** (строитель):

\`\`\`java
public class Pizza {
    private final String size;
    private final boolean cheese;
    private final boolean mushrooms;

    private Pizza(Builder b) {                 // создать пиццу можно только через Builder
        this.size = b.size;
        this.cheese = b.cheese;
        this.mushrooms = b.mushrooms;
    }

    public static class Builder {
        private final String size;
        private boolean cheese;
        private boolean mushrooms;

        public Builder(String size) { this.size = size; }
        public Builder cheese()    { this.cheese = true; return this; }
        public Builder mushrooms() { this.mushrooms = true; return this; }
        public Pizza build()       { return new Pizza(this); }   // private-конструктор внешнего класса доступен
    }

    @Override
    public String toString() {
        return "Pizza " + size + ": сыр=" + cheese + ", грибы=" + mushrooms;
    }
}

Pizza p = new Pizza.Builder("L").cheese().build();
System.out.println(p); // выведет: Pizza L: сыр=true, грибы=false
\`\`\`

Снаружи к вложенному классу обращаются через имя внешнего: \`Pizza.Builder\`, \`Map.Entry\`. Вложенный и внешний класс видят \`private\`-члены друг друга. Но у статического вложенного класса **нет** ссылки на объект внешнего класса, поэтому к его полям экземпляра напрямую обратиться нельзя — только через явную ссылку на объект.

## Внутренние (inner) классы

Внутренний класс объявлен без \`static\`, и каждый его объект *привязан* к объекту внешнего класса. Аналогия: комната существует только в конкретной квартире, и из комнаты видно всё, что есть в этой квартире.

\`\`\`java
class Playlist {
    private final String[] songs = {"Intro", "Hit", "Outro"};

    class Cursor {                         // внутренний класс
        private int index = 0;
        boolean hasNext() { return index < songs.length; }   // видит поле songs своего Playlist
        String next() { return songs[index++]; }
    }

    Cursor cursor() { return new Cursor(); }   // внутри Playlist создаём как обычно
}

Playlist pl = new Playlist();
Playlist.Cursor c = pl.cursor();
Playlist.Cursor c2 = pl.new Cursor();      // снаружи: внешний_объект.new Inner()
while (c.hasNext()) {
    System.out.print(c.next() + " ");      // выведет: Intro Hit Outro
}
\`\`\`

Внутри внутреннего класса ссылка на внешний объект доступна как \`Внешний.this\`. Это важно, когда имена совпадают:

\`\`\`java
class Outer {
    int x = 1;
    class Inner {
        int x = 2;
        void show(int x) {
            System.out.println(x);            // параметр
            System.out.println(this.x);       // поле Inner
            System.out.println(Outer.this.x); // поле Outer
        }
    }
}

new Outer().new Inner().show(3);
// выведет:
// 3
// 2
// 1
\`\`\`

> ⚠️ **Подвох.** Из \`static\`-метода (например, \`main\`) нельзя написать \`new Inner()\`: внутреннему классу нужен внешний объект, а \`this\` в статическом контексте нет. Ошибка: *non-static variable this cannot be referenced from a static context*. Нужно \`outer.new Inner()\` — или сделать класс \`static\`.

> 💡 **Правило.** Если вложенному классу не нужен доступ к полям внешнего объекта, объявляйте его \`static\`. Внутренний класс хранит скрытую ссылку на внешний объект: это лишняя память и риск, что внешний объект не будет собран сборщиком мусора, пока жив внутренний.

## Локальные и анонимные классы

**Локальный класс** объявляется внутри метода и виден только в нём:

\`\`\`java
static List<String> shortWords(List<String> words, int max) {
    class LengthFilter {                         // локальный класс
        boolean ok(String w) { return w.length() <= max; }   // захватил параметр max
    }
    LengthFilter f = new LengthFilter();
    List<String> result = new ArrayList<>();
    for (String w : words) {
        if (f.ok(w)) result.add(w);
    }
    return result;
}
\`\`\`

**Анонимный класс** — класс без имени, который объявляется и создаётся одним выражением. Используется, когда реализация нужна ровно один раз:

\`\`\`java
Comparator<String> byLength = new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
};
List<String> list = new ArrayList<>(List.of("ccc", "a", "bb"));
list.sort(byLength);
System.out.println(list); // выведет: [a, bb, ccc]
\`\`\`

Анонимный класс может реализовать интерфейс или унаследовать класс (в том числе абстрактный, с аргументами конструктора: \`new Shape("круг") { ... }\`). Конструктора у него нет (нет имени), но можно использовать блок инициализации.

## Захват переменных: effectively final

Локальные, анонимные классы и лямбды могут читать локальные переменные и параметры окружающего метода — но только если те **final** или **effectively final** («фактически финальные»: значение присвоено один раз и больше не меняется).

\`\`\`java
int count = 0;
Runnable r = () -> System.out.println(count);  // ошибка компиляции!
count++;                                        // из-за этой строки count не effectively final
\`\`\`

Ошибка: *local variables referenced from a lambda expression must be final or effectively final* (для анонимного класса — *...from an inner class...*). Заметьте: изменение стоит *после* лямбды, но всё равно запрещено — важен сам факт, что переменная меняется.

Почему так: лямбда или объект анонимного класса может жить дольше, чем выполняется метод (например, его передали в другой поток). Поэтому захватывается не переменная, а *копия её значения*. Если бы переменную разрешили менять, копия и оригинал разошлись бы — запрет защищает от путаницы.

> 💡 Ограничение касается только **локальных** переменных. Поля объекта (\`this.count++\`) и элементы массива менять можно — захватывается ссылка на объект, а не само поле.

## Лямбды вместо анонимных классов

Если интерфейс **функциональный** (один абстрактный метод), анонимный класс заменяется лямбдой:

\`\`\`java
// Было: анонимный класс
Runnable hello = new Runnable() {
    @Override
    public void run() { System.out.println("Привет"); }
};

// Стало: лямбда
Runnable hello2 = () -> System.out.println("Привет");

// Ещё короче для компаратора — ссылка на метод
Comparator<String> byLength = Comparator.comparing(String::length);
\`\`\`

Чем лямбда отличается от анонимного класса:
- лямбда подходит **только** для функциональных интерфейсов; анонимный класс — для любого интерфейса и для (абстрактных) классов;
- \`this\` в лямбде — это объект *окружающего* класса; \`this\` в анонимном классе — сам анонимный объект;
- лямбда не создаёт новой области видимости: объявить в ней локальную переменную с именем, которое уже есть в методе, нельзя (*variable is already defined*);
- у анонимного класса могут быть свои поля и несколько методов.

\`\`\`java
public class Main {
    String label = "Main";

    void test() {
        Runnable anon = new Runnable() {
            String label = "anon";
            @Override
            public void run() { System.out.println(this.label); }
        };
        Runnable lambda = () -> System.out.println(this.label);
        anon.run();    // выведет: anon
        lambda.run();  // выведет: Main
    }

    public static void main(String[] args) {
        new Main().test();
    }
}
\`\`\`

## enum: перечисления

Задача: у заказа есть статус — новый, оплачен, доставлен. **Плохо** — константы-числа:

\`\`\`java
static final int NEW = 0, PAID = 1, DELIVERED = 2;
void setStatus(int status) { /* ... */ }
// setStatus(42);  — скомпилируется, хотя статуса 42 не существует
\`\`\`

**Хорошо** — перечисление: тип с фиксированным набором значений, компилятор не пропустит ничего лишнего.

\`\`\`java
enum Status { NEW, PAID, DELIVERED }

Status s = Status.PAID;
System.out.println(s);                         // выведет: PAID
System.out.println(s.name() + " " + s.ordinal()); // выведет: PAID 1
System.out.println(Status.values().length);    // выведет: 3
System.out.println(Status.valueOf("NEW"));     // выведет: NEW
System.out.println(s == Status.PAID);          // выведет: true
\`\`\`

\`enum\` — это полноценный класс, у которого ровно столько объектов, сколько констант. Каждая константа — \`public static final\` объект этого класса. Поэтому сравнивать их через \`==\` безопасно и правильно.

| Метод | Что возвращает |
|---|---|
| \`values()\` | массив всех констант в порядке объявления |
| \`valueOf("NAME")\` | константу по точному имени; иначе \`IllegalArgumentException\` |
| \`name()\` | имя константы, как в коде |
| \`ordinal()\` | порядковый номер с нуля |
| \`compareTo\` | сравнение по \`ordinal\` |
| \`toString()\` | по умолчанию — то же, что \`name()\`; можно переопределить |

> ⚠️ **Подвох.** \`Status.valueOf("paid")\` бросит \`IllegalArgumentException\` — регистр важен. И не храните \`ordinal()\` в базе данных или файлах: стоит вставить новую константу в середину — номера всех следующих сдвинутся.

### Поля, конструкторы и методы

\`\`\`java
enum CupSize {
    SMALL("S", 250), MEDIUM("M", 350), LARGE("L", 500);   // вызовы конструктора

    private final String code;
    private final int ml;

    CupSize(String code, int ml) {      // конструктор неявно private
        this.code = code;
        this.ml = ml;
    }

    int getMl() { return ml; }
    String label() { return code + " (" + ml + " мл)"; }
}

System.out.println(CupSize.LARGE.label()); // выведет: L (500 мл)
\`\`\`

- Список констант идёт **первым**, после него — точка с запятой, затем поля и методы.
- Конструктор всегда \`private\` (явно или неявно); \`public\`-конструктор — ошибка. Создать объект через \`new CupSize(...)\` нельзя.
- Конструкторы вызываются для **всех** констант сразу, в порядке объявления, когда класс enum впервые используется.

### Свой метод для каждой константы

\`\`\`java
enum Operation {
    PLUS("+")  { int apply(int a, int b) { return a + b; } },
    TIMES("*") { int apply(int a, int b) { return a * b; } };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }

    abstract int apply(int a, int b);   // каждая константа обязана реализовать
    String symbol() { return symbol; }
}

for (Operation op : Operation.values()) {
    System.out.println("2 " + op.symbol() + " 3 = " + op.apply(2, 3));
}
// выведет:
// 2 + 3 = 5
// 2 * 3 = 6
\`\`\`

Это полиморфизм без \`switch\`: добавили константу — компилятор заставит реализовать \`apply\`.

### enum в switch

\`\`\`java
static String describe(Status s) {
    switch (s) {
        case NEW:             // без Status. — в Java 17 Status.NEW здесь ошибка
            return "ждёт оплаты";
        case PAID:
            return "оплачен";
        default:
            return "доставлен";
    }
}

static int priority(Status s) {
    return switch (s) {       // switch-выражение: все константы перечислены — default не нужен
        case NEW -> 1;
        case PAID -> 2;
        case DELIVERED -> 3;
    };
}
\`\`\`

В метке \`case\` пишут **просто имя константы**. Если switch-выражение перечисляет все константы, \`default\` не нужен; если какую-то пропустить — ошибка компиляции (*the switch expression does not cover all possible input values*).

### enum и интерфейсы, Singleton

- Enum неявно наследует \`java.lang.Enum\`, поэтому \`extends\` у него быть не может, и от enum нельзя наследоваться. Но реализовывать интерфейсы можно: \`enum Operation implements IntBinaryOperator\`.
- Самый простой и надёжный **Singleton** (единственный экземпляр) в Java — enum с одной константой: JVM сама гарантирует, что объект один, даже при многопоточности и сериализации.

\`\`\`java
enum AppConfig {
    INSTANCE;
    private String theme = "light";
    String getTheme() { return theme; }
    void setTheme(String theme) { this.theme = theme; }
}

AppConfig.INSTANCE.setTheme("dark");
System.out.println(AppConfig.INSTANCE.getTheme()); // выведет: dark
\`\`\`

Для enum есть быстрые коллекции: \`EnumSet.of(Status.NEW, Status.PAID)\` и \`EnumMap<Status, Integer>\`.

## record: классы-данные

\`record\` (Java 16) — краткая запись неизменяемого класса-носителя данных:

\`\`\`java
record Point(int x, int y) { }
\`\`\`

Компилятор сам создаёт:
- \`private final\` поля \`x\` и \`y\`;
- **канонический конструктор** \`Point(int x, int y)\`;
- методы доступа \`x()\` и \`y()\` — **без** приставки \`get\`;
- \`equals\`, \`hashCode\` (по всем компонентам) и \`toString\` вида \`Point[x=1, y=2]\`.

Ограничения:
- record неявно \`final\` — от него нельзя наследоваться;
- record неявно наследует \`java.lang.Record\`, поэтому \`extends\` писать нельзя; интерфейсы реализовывать можно;
- объявлять **поля экземпляра** в теле нельзя (*field declaration must be static*) — только \`static\`-поля; методы и \`static\`-методы — можно;
- дополнительные конструкторы обязаны вызывать канонический через \`this(...)\`.

### Компактный конструктор: проверка и нормализация

\`\`\`java
record Temperature(double celsius) {
    Temperature {                                  // компактный: без списка параметров
        if (celsius < -273.15) {
            throw new IllegalArgumentException("Ниже абсолютного нуля: " + celsius);
        }
    }
}

record Email(String value) {
    Email {
        Objects.requireNonNull(value);
        value = value.trim().toLowerCase();        // меняем ПАРАМЕТР; поле присвоится после
    }
}

System.out.println(new Email("  Ann@Mail.RU ")); // выведет: Email[value=ann@mail.ru]
\`\`\`

Компактный конструктор выполняется **до** присваивания полей: в нём можно проверять и изменять параметры, а присваивание \`this.value = value\` компилятор допишет сам в конце. Написать \`this.value = ...\` внутри компактного конструктора нельзя — ошибка.

### Подвох: неизменяемость record — поверхностная

\`\`\`java
record Team(List<String> members) { }

List<String> names = new ArrayList<>(List.of("Аня", "Борис"));
Team team = new Team(names);
names.add("Вика");                            // меняем исходный список
System.out.println(team.members().size());    // выведет: 3 — record «изменился»!
\`\`\`

Поле \`members\` действительно \`final\`, но \`final\` запрещает менять *ссылку*, а не содержимое списка. Решение — защитная копия в компактном конструкторе:

\`\`\`java
record SafeTeam(List<String> members) {
    SafeTeam {
        members = List.copyOf(members);   // неизменяемая копия
    }
}
\`\`\`

> ⚠️ **Подвох.** Если компонент record — массив, сгенерированный \`equals\` сравнивает **ссылки** на массивы, а не содержимое. Два record с одинаковыми массивами окажутся не равны. Используйте \`List\` или переопределите \`equals\`/\`hashCode\`.

Когда record, а когда обычный класс? Record — для значений, которые определяются своими данными: координаты, деньги, диапазон дат, ответ сервера, ключ \`HashMap\`. Обычный класс — для объектов с изменяемым состоянием и поведением (банковский счёт с балансом, игровой персонаж).

## Шпаргалка

| Конструкция | Ключевое |
|---|---|
| static nested | \`new Outer.Nested()\`; нет ссылки на внешний объект |
| inner | \`outer.new Inner()\`; \`Outer.this.x\`; нельзя создать из static без объекта |
| локальный / анонимный | захватывают только effectively final локальные переменные |
| лямбда | только для функционального интерфейса; \`this\` — окружающий объект |
| enum | \`values()\`, \`valueOf\`, \`name()\`, \`ordinal()\`; конструктор private; сравнение через \`==\` |
| enum в switch | \`case RED:\` без имени типа; switch-выражение по всем константам — без default |
| record | final-поля, \`x()\`, equals/hashCode/toString; нельзя extends и поля экземпляра |
| компактный конструктор | проверка и нормализация параметров до присваивания полей |`,
  tasks: [
    {
      type: 'match',
      q: 'Соедините вид вложенного класса и его описание',
      pairs: [
        ['Статический вложенный', 'Объявлен с static в теле класса; объект внешнего класса не нужен'],
        ['Внутренний (inner)', 'Объявлен без static; каждый объект привязан к объекту внешнего класса'],
        ['Локальный', 'Объявлен внутри метода и виден только в нём'],
        ['Анонимный', 'Не имеет имени; объявляется и создаётся одним выражением new'],
      ],
    },
    {
      type: 'choice',
      q: `Как создать объект внутреннего класса \`Inner\` из метода \`main\` другого класса?
\`\`\`java
class Outer {
    class Inner { }
}
\`\`\``,
      options: [
        '`Outer outer = new Outer(); Outer.Inner in = outer.new Inner();`',
        '`Outer.Inner in = new Outer.Inner();`',
        '`Outer.Inner in = Outer.new Inner();`',
        '`Outer.Inner in = new Inner(new Outer());`',
      ],
      answer: '`Outer outer = new Outer(); Outer.Inner in = outer.new Inner();`',
      explain: 'Внутреннему классу нужен конкретный внешний объект: `внешний.new Inner()`. Запись `new Outer.Inner()` работает только для **статического** вложенного класса.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
class Outer {
    int x = 10;
    class Inner {
        int x = 20;
        void show(int x) {
            System.out.println(x + " " + this.x + " " + Outer.this.x);
        }
    }
}
public class Main {
    public static void main(String[] args) {
        Outer o = new Outer();
        o.x = 5;
        o.new Inner().show(30);
    }
}
\`\`\``,
      answer: ['30 20 5'],
      explain: '`x` — ближайшее объявление, параметр (30). `this.x` — поле объекта `Inner` (20). `Outer.this.x` — поле того внешнего объекта, через который создан `Inner`, а в нём `x` уже изменён на 5.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
class Outer {
    private int x = 1;

    static class Nested {
        int get() { return x; }
    }
}
\`\`\``,
      options: [
        'Да, вложенный класс видит private-поля внешнего',
        'Нет: у статического вложенного класса нет объекта `Outer`, чьё поле `x` можно прочитать',
        'Нет: вложенный класс не может обращаться к private-членам',
        'Да, но `get()` всегда вернёт 0',
      ],
      answer: 'Нет: у статического вложенного класса нет объекта `Outer`, чьё поле `x` можно прочитать',
      explain: '*non-static variable x cannot be referenced from a static context.* Доступ к `private` у вложенного класса есть, но `x` — поле экземпляра, а статический вложенный класс не привязан ни к какому объекту `Outer`. Сработает через явную ссылку: `int get(Outer o) { return o.x; }`.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
public class Main {
    class Helper {
        void help() { System.out.println("помогаю"); }
    }

    public static void main(String[] args) {
        Helper h = new Helper();
        h.help();
    }
}
\`\`\``,
      options: [
        'Да, выведет «помогаю»',
        'Нет: внутреннему классу нужен объект `Main`, а в static-методе `this` нет',
        'Нет: класс `Helper` должен быть `public`',
        'Нет: внутри класса нельзя объявлять классы',
      ],
      answer: 'Нет: внутреннему классу нужен объект `Main`, а в static-методе `this` нет',
      explain: '*non-static variable this cannot be referenced from a static context.* Исправления: `new Main().new Helper()` или (лучше) объявить `static class Helper`, раз ему не нужен объект `Main`.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
class Pizza {
    private final String size;
    private final boolean cheese;
    private final boolean mushrooms;

    private Pizza(Builder b) {
        size = b.size;
        cheese = b.cheese;
        mushrooms = b.mushrooms;
    }

    static class Builder {
        private final String size;
        private boolean cheese, mushrooms;
        Builder(String size) { this.size = size; }
        Builder cheese() { cheese = true; return this; }
        Builder mushrooms() { mushrooms = true; return this; }
        Pizza build() { return new Pizza(this); }
    }

    @Override
    public String toString() { return size + " " + cheese + " " + mushrooms; }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(new Pizza.Builder("M").mushrooms().build());
    }
}
\`\`\``,
      answer: ['M false true'],
      explain: 'Статический вложенный `Builder` создаётся без объекта `Pizza`: `new Pizza.Builder("M")`. Каждый метод возвращает `this`, поэтому вызовы можно сцеплять. `build()` вызывает private-конструктор `Pizza` — вложенному классу это разрешено.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли код?
\`\`\`java
public class Main {
    public static void main(String[] args) {
        int count = 0;
        Runnable r = () -> System.out.println(count);
        count++;
        r.run();
    }
}
\`\`\``,
      options: [
        'Нет: `count` используется в лямбде, но не является effectively final',
        'Да, выведет `0`',
        'Да, выведет `1`',
        'Нет: в лямбде нельзя использовать локальные переменные',
      ],
      answer: 'Нет: `count` используется в лямбде, но не является effectively final',
      explain: 'Переменная, захваченная лямбдой, должна быть final или effectively final. `count++` — даже стоящий *после* лямбды — делает её изменяемой. Ошибка: *local variables referenced from a lambda expression must be final or effectively final*. Читать неизменяемые локальные переменные в лямбде можно.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
public class Main {
    String label = "Main";

    void test() {
        Runnable anon = new Runnable() {
            String label = "anon";
            @Override
            public void run() { System.out.print(this.label + " "); }
        };
        Runnable lambda = () -> System.out.print(this.label + " ");
        anon.run();
        lambda.run();
    }

    public static void main(String[] args) {
        new Main().test();
    }
}
\`\`\``,
      answer: ['anon Main'],
      explain: 'В анонимном классе `this` — сам анонимный объект со своим полем `label`. Лямбда не создаёт новый объект-область: `this` в ней — объект окружающего класса `Main`.',
    },
    {
      type: 'choice',
      q: 'Какие из этих анонимных классов можно заменить лямбдой? Выберите все.',
      options: [
        '`new Runnable() { public void run() { ... } }`',
        '`new Comparator<String>() { public int compare(String a, String b) { ... } }`',
        'Анонимный наследник абстрактного класса `Shape` с методом `area()`',
        'Анонимная реализация интерфейса с двумя абстрактными методами',
      ],
      answer: ['`new Runnable() { public void run() { ... } }`', '`new Comparator<String>() { public int compare(String a, String b) { ... } }`'],
      explain: 'Лямбда реализует только **функциональный интерфейс** — интерфейс ровно с одним абстрактным методом (`Runnable`, `Comparator`). Для наследника класса (даже абстрактного с одним методом) и для интерфейса с двумя абстрактными методами нужен анонимный класс.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
enum Color { RED, GREEN, BLUE }

public class Main {
    public static void main(String[] args) {
        Color c = Color.valueOf("GREEN");
        System.out.println(c.ordinal() + " " + Color.BLUE.name() + " " + Color.values().length);
    }
}
\`\`\``,
      answer: ['1 BLUE 3'],
      explain: '`ordinal()` считается с нуля: RED — 0, GREEN — 1. `name()` возвращает имя константы. `values()` — массив из трёх констант.',
    },
    {
      type: 'choice',
      q: 'Что вернёт `Color.valueOf("green")` для `enum Color { RED, GREEN, BLUE }`?',
      options: [
        'Бросит `IllegalArgumentException`',
        'Вернёт `Color.GREEN`',
        'Вернёт `null`',
        'Ошибка компиляции',
      ],
      answer: 'Бросит `IllegalArgumentException`',
      explain: '`valueOf` ищет константу по **точному** имени с учётом регистра. Нет такой — `IllegalArgumentException` (*No enum constant Color.green*). Компилятор строку не проверяет.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
enum Level {
    LOW, HIGH;

    Level() {
        System.out.print(name() + " ");
    }
}
public class Main {
    public static void main(String[] args) {
        System.out.print("start ");
        Level l = Level.HIGH;
        System.out.print("end");
    }
}
\`\`\``,
      answer: ['start LOW HIGH end'],
      explain: 'Константы enum создаются при первом обращении к классу `Level` — **все сразу** и в порядке объявления. Поэтому, хотя нам нужна только `HIGH`, конструктор сначала отработает для `LOW`.',
    },
    {
      type: 'gaps',
      q: 'Дополните перечисление размеров стакана с полем и конструктором.',
      text: `enum CupSize {
    SMALL(250)[,] MEDIUM(350), LARGE(500)[;]

    private [final] int ml;

    [CupSize](int ml) {
        this.ml = ml;
    }

    int getMl() { return ml; }
}`,
      code: true,
      caseSensitive: true,
      explain: 'Константы перечисляются через запятую, список завершается точкой с запятой (она обязательна, если дальше есть поля или методы). Конструктор называется как enum и неявно `private`.',
    },
    {
      type: 'choice',
      q: `Скомпилируется ли этот код в **Java 17**?
\`\`\`java
enum Color { RED, GREEN }

static String ru(Color c) {
    switch (c) {
        case Color.RED: return "красный";
        default: return "зелёный";
    }
}
\`\`\``,
      options: [
        'Нет: в метке case нужно писать просто `RED`, без `Color.`',
        'Да, это обычная запись',
        'Нет: switch не работает с enum',
        'Нет: у switch по enum не может быть default',
      ],
      answer: 'Нет: в метке case нужно писать просто `RED`, без `Color.`',
      explain: 'В Java 17: *an enum switch case label must be the unqualified name of an enumeration constant*. Тип и так известен из выражения switch. (Квалифицированные метки разрешили только в Java 21.)',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
enum Status { NEW, PAID, DELIVERED }

public class Main {
    static int priority(Status s) {
        return switch (s) {
            case NEW -> 1;
            case PAID -> 2;
            case DELIVERED -> 3;
        };
    }
    public static void main(String[] args) {
        int sum = 0;
        for (Status s : Status.values()) {
            sum += priority(s) * s.ordinal();
        }
        System.out.println(sum);
    }
}
\`\`\``,
      answer: ['8'],
      explain: 'NEW: 1 × 0 = 0, PAID: 2 × 1 = 2, DELIVERED: 3 × 2 = 6. Итого 8. Switch-выражение перечисляет все константы, поэтому `default` не нужен.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
enum Operation {
    PLUS  { int apply(int a, int b) { return a + b; } },
    MINUS { int apply(int a, int b) { return a - b; } },
    TIMES { int apply(int a, int b) { return a * b; } };

    abstract int apply(int a, int b);
}
public class Main {
    public static void main(String[] args) {
        for (Operation op : Operation.values()) {
            System.out.print(op.apply(6, 3) + " ");
        }
    }
}
\`\`\``,
      answer: ['9 3 18'],
      explain: 'Каждая константа имеет своё тело и реализует абстрактный метод `apply`. Вызов `op.apply` полиморфен — как с обычными подклассами.',
    },
    {
      type: 'choice',
      q: 'Какие утверждения об `enum` **верны**? Выберите все.',
      options: [
        'Конструктор enum всегда private (явно или неявно)',
        'Enum может реализовывать интерфейсы',
        'Константы enum можно безопасно сравнивать через `==`',
        'Enum может наследовать другой класс через `extends`',
        'Объект enum можно создать через `new`',
        '`ordinal()` удобно сохранять в базу данных как идентификатор',
      ],
      answer: ['Конструктор enum всегда private (явно или неявно)', 'Enum может реализовывать интерфейсы', 'Константы enum можно безопасно сравнивать через `==`'],
      explain: 'Каждая константа существует в единственном экземпляре, поэтому `==` корректен. Enum уже наследует `java.lang.Enum` — `extends` невозможен. `new` для enum — ошибка (*enum classes may not be instantiated*). `ordinal()` меняется при вставке новых констант — хранить его опасно.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
import java.util.Objects;

record Email(String value) {
    Email {
        Objects.requireNonNull(value);
        value = value.trim().toLowerCase();
    }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(new Email("  Ann@Mail.RU "));
    }
}
\`\`\``,
      answer: ['Email[value=ann@mail.ru]'],
      explain: 'Компактный конструктор меняет **параметр** `value`, а присваивание поля компилятор добавляет в конце — поэтому в поле попадает уже нормализованная строка. `toString` у record — `Имя[компонент=значение]`.',
    },
    {
      type: 'choice',
      q: 'Какие объявления record **не скомпилируются**? Выберите все.',
      options: [
        '`record A(int x) { int y; }`',
        '`record B(int x) extends Object { }`',
        '`record C(int x) { C { this.x = x; } }`',
        '`record D(int x) implements Comparable<D> { public int compareTo(D o) { return Integer.compare(x, o.x); } }`',
        '`record E(int x) { static int count = 0; }`',
        '`record F(int x) { int doubled() { return 2 * x; } }`',
      ],
      answer: ['`record A(int x) { int y; }`', '`record B(int x) extends Object { }`', '`record C(int x) { C { this.x = x; } }`'],
      explain: 'В record нельзя объявлять поля экземпляра (*field declaration must be static*), нельзя писать `extends` (record уже наследует `java.lang.Record`), а в компактном конструкторе нельзя присваивать полям — это сделает компилятор (*cannot assign a value to final variable x*). Реализовывать интерфейсы, объявлять static-поля и методы можно.',
    },
    {
      type: 'choice',
      q: 'Как получить координату `x` у `record Point(int x, int y)`, если `p` — объект `Point`?',
      options: ['`p.x()`', '`p.getX()`', '`p.x` (поле публичное)', '`p.get("x")`'],
      answer: '`p.x()`',
      explain: 'Методы доступа record называются так же, как компоненты, — без `get`. Само поле `x` — `private final`, снаружи напрямую не доступно.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
import java.util.*;

record Team(List<String> members) { }

record SafeTeam(List<String> members) {
    SafeTeam {
        members = List.copyOf(members);
    }
}
public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Аня", "Борис"));
        Team t = new Team(names);
        SafeTeam s = new SafeTeam(names);
        names.add("Вика");
        System.out.println(t.members().size() + " " + s.members().size());
    }
}
\`\`\``,
      answer: ['3 2'],
      explain: '`Team` хранит ссылку на тот же список, что и `names`, поэтому видит добавление. `final` запрещает менять ссылку, но не содержимое списка — неизменяемость record поверхностная. `SafeTeam` сделал защитную копию `List.copyOf`.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите через пробел.
\`\`\`java
import java.util.*;

record ArrBox(int[] data) { }
record ListBox(List<Integer> data) { }

public class Main {
    public static void main(String[] args) {
        boolean a = new ArrBox(new int[]{1, 2}).equals(new ArrBox(new int[]{1, 2}));
        boolean b = new ListBox(List.of(1, 2)).equals(new ListBox(List.of(1, 2)));
        System.out.println(a + " " + b);
    }
}
\`\`\``,
      answer: ['false true'],
      explain: 'Сгенерированный `equals` сравнивает компоненты их собственным `equals`. У массивов `equals` не переопределён — сравниваются ссылки, а массивы разные. У `List` equals сравнивает содержимое.',
    },
    {
      type: 'flashcard',
      front: 'Статический вложенный класс vs внутренний (inner) класс',
      back: '**static nested**: не связан с объектом внешнего класса; создаётся как `new Outer.Nested()`; не может напрямую обращаться к полям экземпляра внешнего класса.\n\n**inner**: каждый объект хранит ссылку на внешний объект (`Outer.this`); создаётся как `outer.new Inner()`; видит поля внешнего объекта.\n\nПравило: если доступ к внешнему объекту не нужен — делайте класс `static`.',
    },
    {
      type: 'flashcard',
      front: 'Что такое **effectively final** и где это важно?',
      back: 'Локальная переменная, которой значение присвоено один раз и больше не меняется (даже без слова `final`).\n\nЛямбды, анонимные и локальные классы могут использовать только такие локальные переменные: они захватывают *копию значения*. Поля объекта это ограничение не затрагивает.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Что компилятор генерирует для `record Point(int x, int y)`?',
      back: '- `private final` поля `x`, `y`;\n- канонический конструктор `Point(int x, int y)`;\n- методы доступа `x()`, `y()`;\n- `equals` и `hashCode` по всем компонентам;\n- `toString()` вида `Point[x=1, y=2]`.\n\nRecord неявно `final`, наследует `java.lang.Record`, не может иметь полей экземпляра.',
      write: true,
    },
    {
      type: 'code',
      lang: 'java',
      q: `Создайте \`enum TrafficLight\` с константами \`RED\`, \`YELLOW\`, \`GREEN\`. У каждой — длительность в секундах (поле + конструктор: 30, 5, 25) и метод \`TrafficLight next()\`, возвращающий следующий сигнал по кругу (после \`GREEN\` — \`RED\`). В \`main\` пройдите 4 переключения начиная с \`RED\` и выведите сигнал и длительность.`,
      starter: `enum TrafficLight {
    // ...
}

public class Main {
    public static void main(String[] args) {
        TrafficLight light = TrafficLight.RED;
        // ...
    }
}`,
      solution: `enum TrafficLight {
    RED(30), YELLOW(5), GREEN(25);

    private final int seconds;

    TrafficLight(int seconds) {
        this.seconds = seconds;
    }

    int getSeconds() { return seconds; }

    TrafficLight next() {
        TrafficLight[] all = values();
        return all[(ordinal() + 1) % all.length];
    }
}

public class Main {
    public static void main(String[] args) {
        TrafficLight light = TrafficLight.RED;
        for (int i = 0; i < 4; i++) {
            System.out.println(light + " " + light.getSeconds());
            light = light.next();
        }
        // RED 30
        // YELLOW 5
        // GREEN 25
        // RED 30
    }
}`,
      explain: 'Использовать `ordinal()` внутри самого enum для перехода по кругу допустимо — он не сохраняется наружу. Альтернатива — `switch`-выражение по `this`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: `Создайте \`record Range(int from, int to)\` — отрезок целых чисел. В компактном конструкторе бросайте \`IllegalArgumentException\`, если \`from > to\`. Добавьте методы \`int length()\` (количество чисел в отрезке) и \`boolean contains(int x)\`, а также статический метод \`Range of(int a, int b)\`, который сам упорядочивает границы. Проверьте в \`main\`.`,
      starter: `record Range(int from, int to) {
    // ...
}

public class Main {
    public static void main(String[] args) {
        // ...
    }
}`,
      solution: `record Range(int from, int to) {
    Range {
        if (from > to) {
            throw new IllegalArgumentException("from > to: " + from + " > " + to);
        }
    }

    static Range of(int a, int b) {
        return new Range(Math.min(a, b), Math.max(a, b));
    }

    int length() {
        return to - from + 1;
    }

    boolean contains(int x) {
        return x >= from && x <= to;
    }
}

public class Main {
    public static void main(String[] args) {
        Range r = Range.of(10, 3);
        System.out.println(r);                // Range[from=3, to=10]
        System.out.println(r.length());       // 8
        System.out.println(r.contains(5));    // true
        System.out.println(r.equals(new Range(3, 10))); // true
        try {
            new Range(5, 1);
        } catch (IllegalArgumentException e) {
            System.out.println("Ошибка: " + e.getMessage()); // Ошибка: from > to: 5 > 1
        }
    }
}`,
      explain: 'Компактный конструктор гарантирует инвариант: некорректный `Range` создать невозможно. `equals`, `hashCode` и `toString` record сгенерировал сам.',
    },
  ],
});
