Trainer.add({
  id: 'java-14-generics-collections',
  title: 'Java 14. Обобщения и коллекции',
  subject: 'Java',
  description: 'Generics, wildcard и правило PECS, стирание типов, автоупаковка и кэш Integer; List, Set, Map, итераторы и неизменяемые коллекции.',
  lesson: `
## Зачем нужны обобщения (generics)

До Java 5 коллекции хранили всё как \`Object\`. Положить можно было что угодно, а при чтении приходилось приводить тип вручную — и ошибка обнаруживалась только **во время выполнения**:

\`\`\`java
List list = new ArrayList();      // «сырой» тип (raw type) — так писать не надо
list.add("Анна");
list.add(42);                     // компилятор не возражает
String name = (String) list.get(1); // ClassCastException во время работы программы
\`\`\`

Обобщения позволяют указать тип элементов в угловых скобках. Теперь компилятор сам следит за типами, а приведения не нужны:

\`\`\`java
List<String> names = new ArrayList<>();
names.add("Анна");
names.add(42);            // ошибка компиляции: int cannot be converted to String
String first = names.get(0); // без приведения
\`\`\`

💡 Аналогия: коробка с наклейкой «только книги». Без наклейки в коробку можно бросить и книгу, и кота, а при разборе вас ждёт сюрприз. С наклейкой кладовщик (компилятор) не даст положить кота ещё на входе.

> 💡 Запомни: главная польза generics — ошибки типов ловятся **при компиляции**, а не у пользователя. \`<>\` справа («ромб», diamond) — компилятор сам выведет тип из левой части.

## Обобщённые классы и методы

Параметр типа объявляется в угловых скобках после имени класса. По соглашению имена — одна заглавная буква: \`T\` (type), \`E\` (element), \`K\`/\`V\` (key/value).

\`\`\`java
class Box<T> {
    private T value;

    Box(T value) { this.value = value; }

    T get() { return value; }
    void set(T value) { this.value = value; }
}

Box<String> book = new Box<>("Война и мир");
String title = book.get();          // String, без приведения
Box<Integer> count = new Box<>(5);
int next = count.get() + 1;         // 6
\`\`\`

Параметров может быть несколько: \`class Pair<K, V>\`, как у \`Map<K, V>\`.

**Обобщённый метод** объявляет свой параметр типа **перед** возвращаемым типом:

\`\`\`java
static <T> T firstOrDefault(List<T> list, T defaultValue) {
    return list.isEmpty() ? defaultValue : list.get(0);
}

firstOrDefault(List.of("a", "b"), "пусто");            // "a"
firstOrDefault(new ArrayList<String>(), "пусто");      // "пусто"
\`\`\`

Тип \`T\` компилятор выводит из аргументов сам.

### Ограничения: extends

Внутри обобщённого кода про \`T\` ничего не известно — можно вызывать только методы \`Object\`. Чтобы сравнивать элементы, нужно **ограничить** параметр: «\`T\` — любой тип, который умеет сравниваться сам с собой».

\`\`\`java
static <T extends Comparable<T>> T max(List<T> list) {
    T best = list.get(0);
    for (T item : list) {
        if (item.compareTo(best) > 0) {
            best = item;
        }
    }
    return best;
}

max(List.of(3, 7, 2));                       // 7
max(List.of("груша", "яблоко", "арбуз"));    // "яблоко" (по алфавиту последнее)
\`\`\`

В ограничениях \`extends\` используется и для классов, и для интерфейсов: \`<T extends Number>\` разрешает вызывать \`doubleValue()\`.

## Инвариантность и wildcard

Самый частый подвох: \`Integer\` — подтип \`Number\`, но **\`List<Integer>\` — не подтип \`List<Number>\`**.

\`\`\`java
List<Number> nums = new ArrayList<Integer>();  // ошибка компиляции
\`\`\`

Почему? Если бы это было разрешено, в список целых чисел можно было бы добавить \`2.5\` через ссылку \`List<Number>\`. Generics **инвариантны**. Массивы, наоборот, **ковариантны** — и за это расплачиваются ошибкой во время выполнения:

\`\`\`java
Object[] arr = new String[2];
arr[0] = "ok";
arr[1] = 1;      // компилируется, но ArrayStoreException при выполнении
\`\`\`

Чтобы метод принимал списки разных типов, используют **wildcard** \`?\`:

| Запись | Что можно передать | Чтение | Запись |
|---|---|---|---|
| \`List<Number>\` | только \`List<Number>\` | \`Number\` | \`Number\` и подтипы |
| \`List<?>\` | список чего угодно | \`Object\` | только \`null\` |
| \`List<? extends Number>\` | \`List<Integer>\`, \`List<Double>\`… | \`Number\` | только \`null\` |
| \`List<? super Integer>\` | \`List<Integer>\`, \`List<Number>\`, \`List<Object>\` | \`Object\` | \`Integer\` |

\`\`\`java
static double sum(List<? extends Number> list) {   // список-ПРОИЗВОДИТЕЛЬ: только читаем
    double s = 0;
    for (Number n : list) {
        s += n.doubleValue();
    }
    return s;
}

static void addNumbers(List<? super Integer> list) { // список-ПОТРЕБИТЕЛЬ: только пишем
    for (int i = 1; i <= 3; i++) {
        list.add(i);
    }
}

sum(List.of(1, 2, 3));      // 6.0
sum(List.of(1.5, 2.5));     // 4.0
List<Object> objs = new ArrayList<>();
addNumbers(objs);           // [1, 2, 3]
\`\`\`

Почему в \`List<? extends Number>\` нельзя добавить \`1\`? Компилятор не знает, что там на самом деле: может, \`List<Double>\`, и тогда \`Integer\` туда класть нельзя. Зато всё, что лежит внутри, точно \`Number\`.

### Правило PECS

**Producer Extends, Consumer Super**: если из коллекции **берут** (она производит значения) — \`? extends T\`; если в неё **кладут** (она потребляет) — \`? super T\`; если и то и другое — просто \`T\`. Классический пример из стандартной библиотеки:

\`\`\`java
public static <T> void copy(List<? super T> dest, List<? extends T> src)  // Collections.copy
\`\`\`

## Стирание типов (type erasure)

Generics существуют только **для компилятора**. После проверки типов он стирает параметры: \`List<String>\` и \`List<Integer>\` в байт-коде — один и тот же класс \`ArrayList\`, а \`T\` превращается в \`Object\` (или в свою границу, например \`Comparable\`).

\`\`\`java
List<String> s = new ArrayList<>();
List<Integer> n = new ArrayList<>();
System.out.println(s.getClass() == n.getClass()); // true
\`\`\`

Отсюда ограничения — всё это **ошибки компиляции**:

- \`new T()\` — во время выполнения неизвестно, объект какого класса создавать;
- \`new T[10]\` — «generic array creation»;
- \`obj instanceof List<String>\` для \`Object obj\` — параметр типа во время выполнения не проверить (а \`obj instanceof List<?>\` — можно);
- \`List<int>\` — параметром типа может быть только **ссылочный** тип; пишут \`List<Integer>\`;
- \`static T field;\` — статическое поле общее для всех \`Box<…>\`, ему неоткуда взять \`T\`;
- два метода \`print(List<String>)\` и \`print(List<Integer>)\` — «name clash: have the same erasure».

## Автоупаковка и её подвохи

Для каждого примитива есть класс-обёртка: \`int\` → \`Integer\`, \`double\` → \`Double\`, \`char\` → \`Character\`, \`boolean\` → \`Boolean\` и т.д. Коллекции хранят только объекты, поэтому Java автоматически **упаковывает** (\`int\` → \`Integer\`, autoboxing) и **распаковывает** (\`Integer\` → \`int\`, unboxing) значения.

\`\`\`java
List<Integer> list = new ArrayList<>();
list.add(5);              // автоупаковка: Integer.valueOf(5)
int x = list.get(0);      // автораспаковка: .intValue()
\`\`\`

### Подвох 1: кэш Integer и ==

\`Integer.valueOf\` (а через него и автоупаковка) кэширует объекты для значений **от −128 до 127**. Оператор \`==\` для объектов сравнивает **ссылки**:

\`\`\`java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println((a == b) + " " + (c == d) + " " + c.equals(d));
// выведет: true false true
int e = 128;
System.out.println(c == e);   // true — Integer распаковывается, сравниваются числа
\`\`\`

### Подвох 2: NullPointerException при распаковке

\`\`\`java
Map<String, Integer> stock = new HashMap<>();
stock.put("груши", 4);
int apples = stock.get("яблоки");   // get вернул null → распаковка null → NullPointerException
\`\`\`

Лечится \`getOrDefault("яблоки", 0)\` или переменной типа \`Integer\` с проверкой на \`null\`.

### Подвох 3: remove(int) и remove(Object)

\`\`\`java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
list.remove(1);                    // удаляет по ИНДЕКСУ 1 → [1, 3]
list.remove(Integer.valueOf(1));   // удаляет ЗНАЧЕНИЕ 1   → [3]
\`\`\`

Перегрузка выбирает \`remove(int index)\` — точное совпадение без упаковки побеждает.

> ⚠️ Подвох: \`Long big = 127L; big.equals(127)\` → \`false\`! Литерал \`127\` упаковывается в \`Integer\`, а \`Long.equals\` возвращает \`true\` только для \`Long\`. Объекты-обёртки всегда сравнивайте через \`equals\` и следите, чтобы типы совпадали.

## Collections Framework

\`\`\`
Iterable
└── Collection
    ├── List    — упорядоченный, с индексами, допускает дубликаты
    ├── Set     — без дубликатов
    └── Queue   — очередь (Deque — двусторонняя)
Map            — пары «ключ → значение» (НЕ наследует Collection)
\`\`\`

Слева пишите **интерфейс**, справа — реализацию: \`List<String> list = new ArrayList<>();\`. Тогда реализацию можно заменить одной строкой, а методы, принимающие \`List\`, работают с любым списком. Это принцип «программируй на уровне интерфейса».

### List

\`\`\`java
List<String> names = new ArrayList<>();
names.add("Оля");
names.add("Иван");
names.add(0, "Анна");             // вставка по индексу
System.out.println(names);        // [Анна, Оля, Иван]
names.get(1);                     // "Оля"
names.set(1, "Ольга");            // замена
names.size();                     // 3
names.contains("Иван");           // true (сравнивает через equals)
names.indexOf("Иван");            // 2
names.remove("Анна");             // [Ольга, Иван]
Collections.sort(names);          // [Иван, Ольга]
\`\`\`

| Операция | \`ArrayList\` (массив внутри) | \`LinkedList\` (двусвязный список) |
|---|---|---|
| \`get(i)\` | O(1) — быстро | O(n) — идём по ссылкам |
| добавить в конец | O(1) в среднем | O(1) |
| вставить/удалить в начале | O(n) — сдвиг элементов | O(1) |
| память | компактно | по два указателя на элемент |

На практике почти всегда выбирают \`ArrayList\`; для очереди и стека — \`ArrayDeque\`.

### Set

\`Set\` не хранит дубликаты (одинаковость определяется через \`equals\`/\`hashCode\` или через сравнение для \`TreeSet\`). Метод \`add\` возвращает \`false\`, если элемент уже был.

\`\`\`java
List<String> words = List.of("кот", "арбуз", "кот", "бегемот", "арбуз");
new LinkedHashSet<>(words);   // [кот, арбуз, бегемот] — порядок добавления
new TreeSet<>(words);         // [арбуз, бегемот, кот] — отсортировано
new HashSet<>(words).size();  // 3 — порядок НЕ гарантирован
\`\`\`

| Реализация | Порядок | Скорость | Требования к элементам |
|---|---|---|---|
| \`HashSet\` | не гарантирован | O(1) | корректные \`equals\` и \`hashCode\` |
| \`LinkedHashSet\` | порядок добавления | O(1) | \`equals\` и \`hashCode\` |
| \`TreeSet\` | по возрастанию | O(log n) | \`Comparable\` или \`Comparator\` |

> ⚠️ Подвох: \`TreeSet\` сортирует строки по кодам символов, поэтому заглавные идут раньше строчных: \`[Apple, apple, banana, cherry]\`. И если в \`HashSet\` кладут объекты класса без переопределённых \`equals\`/\`hashCode\`, два «одинаковых» объекта оба окажутся в множестве (у \`record\` эти методы генерируются автоматически).

### Map

\`\`\`java
Map<String, Integer> m = new HashMap<>();
System.out.println(m.put("a", 1));   // null — раньше значения не было
System.out.println(m.put("a", 2));   // 1   — put возвращает СТАРОЕ значение
m.get("a");                          // 2
m.get("b");                          // null — ключа нет
m.getOrDefault("b", 0);              // 0
m.containsKey("a");                  // true
\`\`\`

Подсчёт частот — классическая задача:

\`\`\`java
String text = "мама мыла раму мама";
Map<String, Integer> freq = new TreeMap<>();
for (String w : text.split(" ")) {
    freq.put(w, freq.getOrDefault(w, 0) + 1);
    // или короче: freq.merge(w, 1, Integer::sum);
}
System.out.println(freq);   // {мама=2, мыла=1, раму=1}

for (Map.Entry<String, Integer> e : freq.entrySet()) {
    System.out.println(e.getKey() + " -> " + e.getValue());
}
\`\`\`

\`HashMap\` — быстрый, порядок не гарантирован; \`LinkedHashMap\` — порядок добавления; \`TreeMap\` — ключи отсортированы. Ключи в \`HashMap\` должны иметь корректные \`equals\`/\`hashCode\` и не меняться после добавления. \`keySet()\`, \`values()\`, \`entrySet()\` дают ключи, значения и пары.

## Перебор и удаление: ConcurrentModificationException

Удалять элементы из коллекции **внутри for-each нельзя**:

\`\`\`java
List<String> list = new ArrayList<>(List.of("a", "b", "c", "d"));
for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);        // следующий шаг цикла → ConcurrentModificationException
    }
}
\`\`\`

for-each внутри использует \`Iterator\`, а тот замечает, что коллекцию изменили «в обход» него. Правильные способы:

\`\`\`java
// 1. Через итератор
Iterator<Integer> it = nums.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) {
        it.remove();           // удаляет последний элемент, возвращённый next()
    }
}

// 2. Короче — removeIf с лямбдой (Java 8+)
nums.removeIf(x -> x % 2 == 0);
\`\`\`

## Неизменяемые коллекции

\`List.of(...)\`, \`Set.of(...)\`, \`Map.of(...)\` создают **неизменяемые** коллекции: \`add\`, \`remove\`, \`set\` бросают \`UnsupportedOperationException\`, а элементы \`null\` запрещены (\`NullPointerException\`). \`Arrays.asList(...)\` — список **фиксированного размера**: \`set\` работает, \`add\`/\`remove\` — нет. Нужна изменяемая копия — \`new ArrayList<>(List.of(1, 2, 3))\`.

Для стека и очереди используйте \`ArrayDeque\`: \`push\`/\`pop\`/\`peek\` — стек (LIFO), \`offer\`/\`poll\`/\`peek\` — очередь (FIFO).

## Шпаргалка

| Тема | Главное |
|---|---|
| Generics | типобезопасность при компиляции, без приведений |
| \`<T extends X>\` | ограничение сверху, можно вызывать методы \`X\` |
| Инвариантность | \`List<Integer>\` — не \`List<Number>\` |
| PECS | читаем — \`? extends\`, пишем — \`? super\` |
| Стирание | нельзя \`new T()\`, \`new T[]\`, \`List<int>\` |
| Кэш \`Integer\` | −128..127; обёртки сравнивать через \`equals\` |
| Распаковка \`null\` | \`NullPointerException\` |
| \`List\` | порядок, индексы, дубликаты; обычно \`ArrayList\` |
| \`Set\` | без дубликатов: Hash / LinkedHash / Tree |
| \`Map\` | ключ → значение; \`put\` возвращает старое значение |
| Удаление при обходе | \`Iterator.remove()\` или \`removeIf\`, не for-each |
| \`List.of\` | неизменяемый, без \`null\` |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nList list = new ArrayList();\nlist.add("Анна");\nlist.add(42);\nString name = (String) list.get(1);\n```',
      options: [
        'Компилируется, но при выполнении — `ClassCastException`',
        'Ошибка компиляции во второй строке с `add`',
        'В `name` окажется строка `"42"`',
        'В `name` окажется `null`',
      ],
      answer: 'Компилируется, но при выполнении — `ClassCastException`',
      explain: 'Сырой (raw) `List` хранит `Object`, поэтому компилятор пропускает и строку, и число. Ошибка всплывает только при приведении `(String)` объекта `Integer`. С `List<String>` строка `list.add(42)` не скомпилировалась бы — в этом и смысл generics.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли строка?\n```java\nList<Number> nums = new ArrayList<Integer>();\n```',
      options: [
        'Нет: `List<Integer>` не является подтипом `List<Number>`',
        'Да: `Integer` — подтип `Number`',
        'Да, но с предупреждением unchecked',
        'Нет: нужно писать `new ArrayList<>()` только с ромбом',
      ],
      answer: 'Нет: `List<Integer>` не является подтипом `List<Number>`',
      explain: 'Generics инвариантны. Иначе через `nums` можно было бы добавить `2.5` в список целых. Чтобы принять список любых чисел, используют `List<? extends Number>`.',
    },
    {
      type: 'choice',
      q: 'Дано `List<? extends Number> list = new ArrayList<Integer>();`. Какие строки **скомпилируются**?',
      options: [
        '`Number n = list.get(0);`',
        '`list.add(null);`',
        '`list.add(1);`',
        '`Integer i = list.get(0);`',
      ],
      answer: ['`Number n = list.get(0);`', '`list.add(null);`'],
      explain: '`? extends Number` — «список чего-то, что является `Number`». Читать можно как `Number`, но конкретный тип неизвестен: это может быть `List<Double>`, поэтому ни `Integer` положить, ни `Integer` прочитать без приведения нельзя. Добавить можно только `null`.',
    },
    {
      type: 'choice',
      q: 'Дано `List<? super Integer> list = new ArrayList<Number>();`. Какие строки **скомпилируются**?',
      options: [
        '`list.add(5);`',
        '`Object o = list.get(0);`',
        '`Integer i = list.get(0);`',
        '`list.add(2.5);`',
      ],
      answer: ['`list.add(5);`', '`Object o = list.get(0);`'],
      explain: '`? super Integer` — список, куда **точно** можно класть `Integer` (это `List<Integer>`, `List<Number>` или `List<Object>`). Но что лежит внутри — неизвестно, поэтому читаем только как `Object`. `2.5` — это `Double`, его в `List<Integer>` класть нельзя.',
    },
    {
      type: 'match',
      q: 'Соедините тип параметра метода и его смысл',
      pairs: [
        ['`List<T>`', 'и читаем, и пишем элементы типа T'],
        ['`List<? extends T>`', 'только читаем: коллекция-производитель'],
        ['`List<? super T>`', 'только кладём T: коллекция-потребитель'],
        ['`List<?>`', 'список чего угодно, элементы читаются как Object'],
      ],
    },
    {
      type: 'choice',
      q: 'Какие строки внутри `class Box<T> { ... }` дадут **ошибку компиляции**?',
      options: [
        '`T item = new T();`',
        '`T[] items = new T[10];`',
        '`static T shared;`',
        '`private List<T> items = new ArrayList<>();`',
        '`private T[] items;`',
        '`static <U> void show(U u) { System.out.println(u); }`',
      ],
      answer: ['`T item = new T();`', '`T[] items = new T[10];`', '`static T shared;`'],
      explain: 'Из-за стирания типов во время выполнения `T` неизвестен: нельзя создать объект или массив `T`. Статическое поле одно на все `Box<String>`, `Box<Integer>`…, поэтому `T` в static-контексте недоступен. Объявить поле `T[]` можно, обобщённый статический метод со своим `<U>` — тоже.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nList<String> s = new ArrayList<>();\nList<Integer> n = new ArrayList<>();\nSystem.out.println(s.getClass() == n.getClass());\n```',
      answer: ['true'],
      explain: 'Стирание типов: во время выполнения оба объекта — просто `java.util.ArrayList`. Параметры `<String>` и `<Integer>` существуют только для компилятора.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nInteger a = 127, b = 127;\nInteger c = 128, d = 128;\nSystem.out.println((a == b) + " " + (c == d) + " " + c.equals(d));\n```',
      answer: ['true false true'],
      explain: 'Автоупаковка использует `Integer.valueOf`, который кэширует объекты от −128 до 127: `a` и `b` — один объект. `128` вне кэша — создаются два разных объекта, `==` сравнивает ссылки → `false`. `equals` сравнивает значения → `true`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nMap<String, Integer> stock = new HashMap<>();\nstock.put("груши", 4);\nint apples = stock.get("яблоки");\nSystem.out.println(apples);\n```',
      options: [
        '`NullPointerException`',
        'Выведет `0`',
        'Выведет `null`',
        'Ошибка компиляции: нельзя присвоить `Integer` в `int`',
      ],
      answer: '`NullPointerException`',
      explain: '`get` для отсутствующего ключа возвращает `null`, а присваивание в `int` вызывает автораспаковку `null.intValue()`. Безопасно: `stock.getOrDefault("яблоки", 0)`.',
    },
    {
      type: 'input',
      q: 'Что выведет код? Запишите две строки вывода через пробел.\n```java\nList<Integer> list = new ArrayList<>(List.of(1, 2, 3));\nlist.remove(1);\nSystem.out.println(list);\nlist.remove(Integer.valueOf(1));\nSystem.out.println(list);\n```',
      answer: ['[1, 3] [3]'],
      hint: 'У `List` два метода: `remove(int index)` и `remove(Object o)`.',
      explain: '`remove(1)` с аргументом `int` выбирает `remove(int index)` — точное совпадение без упаковки, удаляется элемент с индексом 1 (это `2`). `remove(Integer.valueOf(1))` вызывает `remove(Object)` и удаляет значение `1`.',
    },
    {
      type: 'choice',
      q: 'Чем `ArrayList` отличается от `LinkedList` по скорости операций?',
      options: [
        '`get(i)` у `ArrayList` — O(1), у `LinkedList` — O(n)',
        '`get(i)` у обоих — O(1)',
        'У `LinkedList` быстрее `get(i)`, у `ArrayList` — вставка в начало',
        'Разницы нет, это два имени одного класса',
      ],
      answer: '`get(i)` у `ArrayList` — O(1), у `LinkedList` — O(n)',
      explain: '`ArrayList` хранит элементы в массиве и сразу вычисляет адрес по индексу. `LinkedList` — двусвязный список: чтобы дойти до i-го элемента, нужно пройти по ссылкам. Зато вставка/удаление в начале у `LinkedList` — O(1), а у `ArrayList` — сдвиг элементов O(n).',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nSystem.out.println(new TreeSet<>(List.of("banana", "Apple", "cherry", "apple")));\n```',
      answer: ['[Apple, apple, banana, cherry]'],
      explain: '`TreeSet` сортирует по `compareTo` строк, то есть по кодам символов. Заглавная `A` (код 65) меньше любой строчной буквы, поэтому `Apple` идёт первым.',
    },
    {
      type: 'input',
      q: 'Что выведет код? Запишите три строки вывода через пробел.\n```java\nSet<String> set = new LinkedHashSet<>();\nSystem.out.println(set.add("кот"));\nset.add("пёс");\nSystem.out.println(set.add("кот"));\nSystem.out.println(set);\n```',
      answer: ['true false [кот, пёс]'],
      explain: '`add` возвращает `true`, если элемент добавлен, и `false`, если такой уже есть. `LinkedHashSet` сохраняет порядок добавления.',
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```java\nclass Point {\n    final int x, y;\n    Point(int x, int y) { this.x = x; this.y = y; }\n}\n\nSet<Point> set = new HashSet<>();\nset.add(new Point(1, 2));\nset.add(new Point(1, 2));\nSystem.out.println(set.size());\n```',
      options: ['`2`', '`1`', '`0`', 'Ошибка компиляции: `Point` не реализует `Comparable`'],
      answer: '`2`',
      explain: 'В `Point` не переопределены `equals` и `hashCode`, поэтому используются версии из `Object`, сравнивающие ссылки: два `new` — два разных объекта. Если объявить `record Point(int x, int y)`, размер будет `1` — record генерирует `equals`/`hashCode` по полям.',
    },
    {
      type: 'input',
      q: 'Что выведет код?\n```java\nMap<String, Integer> m = new HashMap<>();\nSystem.out.println(m.put("a", 1) + " " + m.put("a", 2) + " " + m.get("a"));\n```',
      answer: ['null 1 2'],
      explain: '`put` возвращает **предыдущее** значение по ключу: в первый раз его не было (`null`), во второй — было `1`. После этого по ключу `"a"` лежит `2`.',
    },
    {
      type: 'gaps',
      q: 'Допишите подсчёт, сколько раз встречается каждое слово, и вывод результата',
      code: true,
      caseSensitive: true,
      text: 'String\\[] words = {"да", "нет", "да", "да"};\nMap<String, Integer> freq = new [TreeMap|HashMap|LinkedHashMap]<>();\nfor (String w : words) {\n    freq.put(w, freq.[getOrDefault](w, 0) + 1);\n}\nfor (Map.[Entry]<String, Integer> e : freq.[entrySet]()) {\n    System.out.println(e.[getKey]() + ": " + e.getValue());\n}',
      explain: '`getOrDefault(w, 0)` возвращает 0 для нового слова, избавляя от `NullPointerException`. Пары перебирают через `entrySet()`, каждая пара — `Map.Entry` с методами `getKey()` и `getValue()`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nList<String> list = new ArrayList<>(List.of("a", "b", "c", "d"));\nfor (String s : list) {\n    if (s.equals("b")) {\n        list.remove(s);\n    }\n}\nSystem.out.println(list);\n```',
      options: [
        '`ConcurrentModificationException`',
        'Выведет `[a, c, d]`',
        'Выведет `[a, b, c, d]`',
        'Ошибка компиляции: внутри for-each нельзя вызывать `remove`',
      ],
      answer: '`ConcurrentModificationException`',
      explain: 'for-each работает через итератор. После `list.remove(s)` итератор на следующем шаге замечает, что список изменён в обход него, и бросает исключение. Правильно: `list.removeIf(s -> s.equals("b"))` или `Iterator.remove()`.',
    },
    {
      type: 'gaps',
      q: 'Удалите из списка `nums` все чётные числа с помощью итератора',
      code: true,
      caseSensitive: true,
      text: 'Iterator<Integer> it = nums.[iterator]();\nwhile (it.[hasNext]()) {\n    if (it.[next]() % 2 == 0) {\n        it.[remove]();\n    }\n}',
      explain: '`hasNext()` проверяет, есть ли ещё элементы, `next()` возвращает очередной, `remove()` удаляет последний возвращённый — безопасно, без `ConcurrentModificationException`. Короткая альтернатива: `nums.removeIf(x -> x % 2 == 0)`.',
    },
    {
      type: 'choice',
      q: 'Какие строки выбросят `UnsupportedOperationException`?',
      options: [
        '`List.of(1, 2, 3).add(4);`',
        '`List.of(1, 2, 3).set(0, 9);`',
        '`Arrays.asList(1, 2, 3).add(4);`',
        '`Arrays.asList(1, 2, 3).set(0, 9);`',
        '`new ArrayList<>(List.of(1, 2, 3)).add(4);`',
      ],
      answer: ['`List.of(1, 2, 3).add(4);`', '`List.of(1, 2, 3).set(0, 9);`', '`Arrays.asList(1, 2, 3).add(4);`'],
      explain: '`List.of` полностью неизменяем. `Arrays.asList` — обёртка над массивом фиксированного размера: заменить элемент можно, изменить размер — нет. `new ArrayList<>(...)` — обычная изменяемая копия.',
    },
    {
      type: 'match',
      q: 'Соедините коллекцию и её главное свойство',
      pairs: [
        ['`ArrayList`', 'список на массиве, быстрый доступ по индексу'],
        ['`LinkedList`', 'двусвязный список, быстрые вставки по краям'],
        ['`HashSet`', 'уникальные элементы, порядок не гарантирован'],
        ['`LinkedHashSet`', 'уникальные элементы в порядке добавления'],
        ['`TreeSet`', 'уникальные элементы, отсортированы'],
        ['`TreeMap`', 'пары ключ-значение, ключи отсортированы'],
        ['`ArrayDeque`', 'стек и очередь: push/pop, offer/poll'],
      ],
    },
    {
      type: 'order',
      q: 'Расставьте строки вывода в правильном порядке\n```java\nMap<String, Integer> basket = new TreeMap<>();\nbasket.put("груша", 3);\nbasket.put("арбуз", 1);\nbasket.put("яблоко", 5);\nbasket.put("груша", 2);\nfor (Map.Entry<String, Integer> e : basket.entrySet()) {\n    System.out.println(e.getKey() + "=" + e.getValue());\n}\n```',
      items: ['арбуз=1', 'груша=2', 'яблоко=5'],
      join: '\n',
      explain: '`TreeMap` хранит ключи отсортированными. Повторный `put("груша", 2)` не добавляет новую пару, а заменяет значение.',
    },
    {
      type: 'flashcard',
      front: 'Что такое правило **PECS**?',
      back: '**Producer Extends, Consumer Super.** Если из коллекции только читают (она производит значения) — параметр `? extends T`. Если в неё только кладут (она потребляет) — `? super T`. Если и то и другое — просто `T`.\n\nПример: `Collections.copy(List<? super T> dest, List<? extends T> src)`.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Что такое **стирание типов** и какие у него последствия?',
      back: 'Параметры generics проверяются только компилятором и стираются в байт-коде (`T` → `Object` или граница). Поэтому нельзя: `new T()`, `new T[n]`, `instanceof List<String>` для произвольного объекта, `List<int>`, `static T` поле, перегрузка `f(List<String>)` и `f(List<Integer>)`. `List<String>` и `List<Integer>` во время выполнения — один класс.',
    },
    {
      type: 'flashcard',
      front: 'Почему объекты `Integer` нельзя сравнивать через `==`?',
      back: '`==` для объектов сравнивает **ссылки**. Автоупаковка через `Integer.valueOf` кэширует только значения от −128 до 127, поэтому `127 == 127` даёт `true`, а `128 == 128` — `false`. Сравнивайте через `equals` (или распакуйте в `int`). И помните: распаковка `null` → `NullPointerException`.',
    },
    {
      type: 'input',
      q: 'Как называется автоматическое преобразование `int` в `Integer` (например, при `list.add(5)`)?',
      answer: ['автоупаковка', 'autoboxing', 'упаковка', 'boxing', 'автобоксинг'],
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите обобщённый неизменяемый класс `Pair<A, B>` с полями `first` и `second`, геттерами, методом `swap()`, который возвращает **новую** пару с переставленными элементами (`Pair<B, A>`), и `toString()` в формате `(первый, второй)`.\n\nВ `main` создайте `Pair<String, Integer>("Анна", 19)`, выведите её и результат `swap()`, затем достаньте значения без приведения типов.',
      starter: `class Pair<A, B> {
    // ваш код
}

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    public A getFirst() { return first; }
    public B getSecond() { return second; }

    public Pair<B, A> swap() {
        return new Pair<>(second, first);
    }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        Pair<String, Integer> student = new Pair<>("Анна", 19);
        Pair<Integer, String> swapped = student.swap();
        String name = student.getFirst();      // без приведения типов
        int age = swapped.getFirst();          // автораспаковка Integer -> int
        System.out.println(student + " " + swapped);
        System.out.println(name + " " + (age + 1));
    }
}
// выведет:
// (Анна, 19) (19, Анна)
// Анна 20`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите два статических метода:\n1. `max(List<T> list)` — возвращает наибольший элемент списка любых сравнимых объектов (подберите правильное ограничение для `T`); для пустого списка — `IllegalArgumentException`.\n2. `average(...)` — среднее арифметическое списка **любых** чисел (`List<Integer>`, `List<Double>` и т.д.); для пустого списка — `0`.\n\nПроверьте: `max(List.of(4, 17, 9))`, `max(List.of("киви", "ананас", "манго"))`, `average(List.of(1, 2, 3, 4))`, `average(List.of(2.5, 3.5))`.',
      starter: `import java.util.List;

public class Main {
    // max

    // average

    public static void main(String[] args) {
        // проверка
    }
}`,
      solution: `import java.util.List;

public class Main {
    static <T extends Comparable<T>> T max(List<T> list) {
        if (list.isEmpty()) {
            throw new IllegalArgumentException("Список пуст");
        }
        T best = list.get(0);
        for (T item : list) {
            if (item.compareTo(best) > 0) {
                best = item;
            }
        }
        return best;
    }

    static double average(List<? extends Number> numbers) {
        if (numbers.isEmpty()) {
            return 0;
        }
        double sum = 0;
        for (Number n : numbers) {
            sum += n.doubleValue();
        }
        return sum / numbers.size();
    }

    public static void main(String[] args) {
        System.out.println(max(List.of(4, 17, 9)));                    // 17
        System.out.println(max(List.of("киви", "ананас", "манго")));   // манго
        System.out.println(average(List.of(1, 2, 3, 4)));              // 2.5
        System.out.println(average(List.of(2.5, 3.5)));                // 3.0
    }
}`,
      hint: 'Для `max` нужен `<T extends Comparable<T>>`, для `average` — `List<? extends Number>` и `doubleValue()`.',
      explain: 'Почему `average` не может принимать `List<Number>`? Тогда передать `List<Integer>` было бы нельзя — generics инвариантны. `? extends Number` разрешает любой список чисел только для чтения — ровно то, что нужно (PECS: список-производитель).',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите метод `static Map<String, Integer> countWords(String text)`, который приводит текст к нижнему регистру, разбивает по пробелам и считает, сколько раз встречается каждое слово. Слова в результате должны идти **по алфавиту**.\n\nВ `main` для строки `"Кот и пёс и кот и мышь"` выведите всю карту, а затем только слова, встречающиеся больше одного раза, в формате `слово — количество`.',
      starter: `import java.util.Map;
import java.util.TreeMap;

public class Main {
    static Map<String, Integer> countWords(String text) {
        // ваш код
    }

    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `import java.util.Map;
import java.util.TreeMap;

public class Main {
    static Map<String, Integer> countWords(String text) {
        Map<String, Integer> freq = new TreeMap<>();
        for (String word : text.toLowerCase().split(" ")) {
            if (!word.isEmpty()) {
                freq.merge(word, 1, Integer::sum);
            }
        }
        return freq;
    }

    public static void main(String[] args) {
        Map<String, Integer> freq = countWords("Кот и пёс и кот и мышь");
        System.out.println(freq);
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            if (e.getValue() > 1) {
                System.out.println(e.getKey() + " — " + e.getValue());
            }
        }
    }
}
// выведет:
// {и=3, кот=2, мышь=1, пёс=1}
// и — 3
// кот — 2`,
      explain: 'Сортировку по алфавиту даёт `TreeMap`. `merge(word, 1, Integer::sum)` кладёт 1 для нового слова, а для существующего складывает старое значение с 1 — то же, что `put(word, getOrDefault(word, 0) + 1)`. Возвращаемый тип — интерфейс `Map`, а не `TreeMap`.',
    },
  ],
});
