Trainer.add({
  id: 'java-11-object-methods',
  title: 'Java 11. equals, hashCode, toString и сравнение',
  subject: 'Java',
  description: 'Методы класса Object, == против equals, контракты equals и hashCode, как сломать HashSet и как этого избежать, Comparable и Comparator, что генерирует record.',
  lesson: `## Класс Object — общий предок

Любой класс в Java неявно наследует \`java.lang.Object\`. Поэтому у *каждого* объекта есть его методы:

| Метод | Что делает по умолчанию |
|---|---|
| \`boolean equals(Object o)\` | сравнивает ссылки: \`this == o\` |
| \`int hashCode()\` | «отпечаток» объекта, обычно разный у разных объектов |
| \`String toString()\` | \`ИмяКласса@хэш_в_шестнадцатеричном_виде\` |
| \`Class<?> getClass()\` | реальный класс объекта во время выполнения |
| \`clone()\` | копирование (protected, сложный механизм, используется редко) |
| \`wait()\`, \`notify()\`, \`notifyAll()\` | для многопоточности |

На практике в своих классах почти всегда переопределяют три: **toString**, **equals** и **hashCode**. Причём последние два — **только вместе**.

## toString: как объект выглядит в виде строки

\`\`\`java
class Point {
    private final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}

System.out.println(new Point(1, 2)); // выведет что-то вроде: Point@1b6d3586
\`\`\`

\`println\`, конкатенация \`"p = " + p\` и \`String.valueOf(p)\` неявно вызывают \`toString()\`. Стандартная реализация печатает имя класса и хэш-код в шестнадцатеричном виде — для отладки бесполезно. Переопределяем:

\`\`\`java
@Override
public String toString() {
    return "Point(" + x + ", " + y + ")";
}
// System.out.println(new Point(1, 2));  выведет: Point(1, 2)
\`\`\`

> ⚠️ **Подвох.** У массивов \`toString()\` не переопределён: \`System.out.println(new int[]{1, 2})\` печатает что-то вроде \`[I@6d06d69c\`. Для массивов используйте \`Arrays.toString(arr)\`.

## == против equals

- \`==\` для ссылок проверяет **идентичность**: это один и тот же объект в памяти?
- \`equals\` проверяет **логическое равенство**: эти объекты означают одно и то же?

Аналогия: два экземпляра одной книги в библиотеке. \`==\` спрашивает «это тот же самый физический томик?» — нет. \`equals\` спрашивает «это та же книга (тот же ISBN)?» — да.

> ⚠️ **Подвох.** \`Object.equals\` по умолчанию — это просто \`this == obj\`. Пока вы его не переопределили, \`equals\` ведёт себя *ровно так же*, как \`==\`.

\`\`\`java
Point a = new Point(1, 2);
Point b = new Point(1, 2);
System.out.println(a == b);      // выведет: false — разные объекты
System.out.println(a.equals(b)); // выведет: false — equals не переопределён!
\`\`\`

\`String\`, \`Integer\`, \`LocalDate\`, \`List\` и другие классы JDK equals уже переопределили — поэтому строки сравнивают через \`equals\`.

## Контракт equals

Коллекции (\`contains\`, \`indexOf\`, \`remove\`, \`HashSet\`, \`HashMap\`) *рассчитывают*, что ваш \`equals\` подчиняется пяти правилам. Нарушите — коллекции начнут вести себя непредсказуемо. Для любых не-\`null\` ссылок \`x\`, \`y\`, \`z\`:

1. **Рефлексивность:** \`x.equals(x)\` — \`true\`.
2. **Симметричность:** \`x.equals(y)\` возвращает то же, что \`y.equals(x)\`.
3. **Транзитивность:** если \`x.equals(y)\` и \`y.equals(z)\`, то \`x.equals(z)\`.
4. **Согласованность:** повторные вызовы дают тот же результат, пока объекты не менялись.
5. **Сравнение с null:** \`x.equals(null)\` — \`false\` (и никаких исключений).

## Правильный equals — пошагово

\`\`\`java
import java.util.Objects;

public final class Book {
    private final String title;
    private final int year;
    private final double price;

    public Book(String title, int year, double price) {
        this.title = title;
        this.year = year;
        this.price = price;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                                 // 1. тот же объект — быстро
        if (o == null || getClass() != o.getClass()) return false;  // 2. null или другой класс
        Book other = (Book) o;                                      // 3. приведение
        return year == other.year                                   // 4. значимые поля
                && Double.compare(price, other.price) == 0
                && Objects.equals(title, other.title);
    }

    @Override
    public int hashCode() {
        return Objects.hash(title, year, price);                    // те же поля, что в equals
    }

    @Override
    public String toString() {
        return "Book{title='" + title + "', year=" + year + ", price=" + price + "}";
    }
}
\`\`\`

Как сравнивать поля:
- \`int\`, \`long\`, \`char\`, \`boolean\`… — через \`==\`;
- \`double\` и \`float\` — через \`Double.compare(a, b) == 0\` / \`Float.compare\` (у \`==\` странности с \`NaN\` и \`-0.0\`: \`Double.NaN == Double.NaN\` — \`false\`);
- ссылочные поля — через \`Objects.equals(a, b)\`: он не упадёт, если поле равно \`null\`;
- массивы — через \`Arrays.equals(a, b)\`.

Параметр — **обязательно** \`Object\`, и обязательно ставьте \`@Override\`.

### Подвох 1: перегрузка вместо переопределения

\`\`\`java
class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    public boolean equals(Point p) {          // ПЕРЕГРУЗКА: параметр Point, а не Object
        return x == p.x && y == p.y;
    }
}

List<Point> list = new ArrayList<>();
list.add(new Point(1, 2));
Point q = new Point(1, 2);
System.out.println(q.equals(list.get(0)));  // выведет: true  — вызвали equals(Point)
System.out.println(list.contains(q));       // выведет: false — коллекция вызывает equals(Object)
\`\`\`

Коллекция внутри вызывает \`equals(Object)\` — а его мы не переопределили, работает сравнение ссылок из \`Object\`. Это прямое следствие урока 9: вариант перегрузки выбирается при компиляции, и в коде \`ArrayList\` выбран \`equals(Object)\`. Если поставить \`@Override\` над \`equals(Point p)\`, компилятор сразу сообщит, что метод ничего не переопределяет (*does not override or implement a method from a supertype*).

### Подвох 2: getClass() или instanceof

Можно проверять тип через \`instanceof\`. С Java 16 это даже короче, и \`null\` отсекается автоматически:

\`\`\`java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Point p)) return false;   // null instanceof Point — false
    return x == p.x && y == p.y;
}
\`\`\`

Но при наследовании с новыми полями \`instanceof\` ломает симметричность. Пусть \`ColorPoint extends Point\` добавляет цвет и сравнивает его в своём equals через \`instanceof ColorPoint\`:

\`\`\`java
Point p = new Point(1, 2);
ColorPoint cp = new ColorPoint(1, 2, "red");
p.equals(cp);   // true:  cp — это Point, координаты совпали
cp.equals(p);   // false: p — не ColorPoint
\`\`\`

\`p.equals(cp) != cp.equals(p)\` — симметричность нарушена. Варианты решения:
- \`getClass() != o.getClass()\` — объекты разных классов никогда не равны. Симметрично, но \`Point\` и его потомок без новых полей тоже станут «не равны».
- \`instanceof\` + сделать класс (или метод \`equals\`) \`final\`, чтобы никто не переопределил equals с новыми полями. Хороший выбор для классов-значений.
- Предпочесть композицию наследованию: \`ColorPoint\` *содержит* \`Point\` (урок 15).

## hashCode: зачем он нужен

\`HashSet\` и \`HashMap\` хранят элементы в «корзинах» (buckets). Номер корзины вычисляется по \`hashCode()\`. Поиск элемента:
1. вычислить \`hashCode()\` искомого объекта;
2. по нему найти корзину;
3. только **внутри этой корзины** сравнить элементы через \`equals\`.

Аналогия — библиотечный каталог с ящиками по первой букве фамилии. Чтобы найти карточку «Иванов», вы открываете ящик «И» и перебираете только его. Если бы одинаковые карточки могли лежать в разных ящиках, вы бы открыли не тот ящик и решили, что карточки нет.

### Контракт hashCode

1. Пока поля, участвующие в \`equals\`, не меняются, \`hashCode()\` возвращает одно и то же число.
2. **Если \`a.equals(b)\`, то \`a.hashCode() == b.hashCode()\`.** Это главное правило.
3. Если объекты не равны, хэш-коды *могут* совпасть (коллизия) — это допустимо, но чем реже, тем быстрее работают хэш-таблицы.

Обратное к правилу 2 **неверно**: одинаковый хэш не означает равенства. Например, \`"Aa".hashCode() == "BB".hashCode()\` — оба равны 2112.

### Как сломать HashSet: equals без hashCode

\`\`\`java
class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
    // hashCode НЕ переопределён — используется Object.hashCode()
}

Set<Point> set = new HashSet<>();
set.add(new Point(1, 2));
System.out.println(set.contains(new Point(1, 2))); // выведет: false
set.add(new Point(1, 2));
System.out.println(set.size());                    // выведет: 2
\`\`\`

Объекты равны по \`equals\`, но \`Object.hashCode()\` у разных объектов почти наверняка разный — они попадают в разные корзины, и до \`equals\` дело просто не доходит. Множество хранит «дубликаты», а \`HashMap\` не находит значение по равному ключу. Исправление — одна строка:

\`\`\`java
@Override
public int hashCode() {
    return Objects.hash(x, y);    // или вручную: 31 * x + y
}
\`\`\`

> 💡 **Запомни.** Переопределили \`equals\` — переопределите \`hashCode\` по **тем же полям**. В \`hashCode\` нельзя использовать поля, которых нет в \`equals\` (тогда равные объекты получат разные хэши).

> ⚠️ **Подвох: изменяемый ключ.** Если изменить поле объекта, который уже лежит в \`HashSet\` (или является ключом \`HashMap\`), его хэш изменится, а сам объект останется в старой корзине. \`set.contains(obj)\` вернёт \`false\` для объекта, который *лежит в множестве*. Поэтому ключи хэш-коллекций лучше делать неизменяемыми.

> ⚠️ **Подвох.** \`return 42;\` в \`hashCode()\` формально контракт не нарушает (равные объекты — равные хэши), но все элементы попадут в одну корзину, и \`HashMap\` будет работать намного медленнее.

Вручную хэш обычно считают так: \`int h = 17; h = 31 * h + x; h = 31 * h + y;\`. Число 31 — нечётное простое, умножение на него компилятор заменяет сдвигом и вычитанием.

## Помощники из java.util.Objects

| Метод | Что делает |
|---|---|
| \`Objects.equals(a, b)\` | \`true\`, если оба \`null\` или \`a.equals(b)\`; не бросает NPE |
| \`Objects.hash(a, b, c)\` | хэш по нескольким полям (с упаковкой примитивов) |
| \`Objects.hashCode(o)\` | \`0\` для \`null\`, иначе \`o.hashCode()\` |
| \`Objects.requireNonNull(o)\` | бросает NPE сразу, если \`o == null\` |

## Comparable: естественный порядок

Чтобы объекты можно было сортировать (\`Collections.sort\`, \`Arrays.sort\`) и хранить в \`TreeSet\`/\`TreeMap\`, класс реализует \`Comparable<T>\` с методом \`int compareTo(T other)\`:
- **отрицательное** число — \`this\` меньше \`other\` (идёт раньше);
- **ноль** — равны по порядку;
- **положительное** — \`this\` больше.

Важен только **знак**, а не величина: \`-1\` и \`-100\` означают одно и то же.

\`\`\`java
class Student implements Comparable<Student> {
    final String name;
    final int score;
    Student(String name, int score) { this.name = name; this.score = score; }

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.score, other.score);   // по возрастанию баллов
    }
    @Override
    public String toString() { return name + "=" + score; }
}

List<Student> list = new ArrayList<>(List.of(
        new Student("Оля", 90), new Student("Ян", 75), new Student("Аня", 82)));
Collections.sort(list);
System.out.println(list); // выведет: [Ян=75, Аня=82, Оля=90]
\`\`\`

> ⚠️ **Подвох: вычитание.** \`return this.score - other.score;\` выглядит красиво, но переполняется на больших по модулю числах: \`Integer.MIN_VALUE - 1\` даёт \`2147483647\` — положительное, хотя первое число меньше. Используйте \`Integer.compare\`, \`Long.compare\`, \`Double.compare\`.

> ⚠️ **Подвох: согласованность с equals.** Желательно, чтобы \`compareTo\` возвращал 0 тогда и только тогда, когда \`equals\` — \`true\`. \`TreeSet\` и \`TreeMap\` определяют «одинаковость» **через compareTo, а не через equals**. Если сравнивать людей только по имени, \`TreeSet\` не добавит второго человека с тем же именем. Реальный пример из JDK: \`new BigDecimal("1.0")\` и \`new BigDecimal("1.00")\` не равны по \`equals\` (разная точность), но \`compareTo\` даёт 0 — в \`HashSet\` их будет два, в \`TreeSet\` — один.

## Comparator: внешний порядок

\`Comparable\` задаёт *один* «естественный» порядок внутри класса. Если нужно сортировать по-разному (по имени, по возрасту, по убыванию) или класс чужой и его нельзя изменить — используют \`Comparator<T>\` с методом \`int compare(T a, T b)\`. Это функциональный интерфейс, поэтому подходят лямбды:

\`\`\`java
record Person(String name, int age) { }

List<Person> people = new ArrayList<>(List.of(
        new Person("Оля", 20), new Person("Ян", 19),
        new Person("Аня", 20), new Person("Борис", 19)));

people.sort((a, b) -> Integer.compare(a.age(), b.age()));          // лямбда вручную

people.sort(Comparator.comparingInt(Person::age)                   // по возрасту,
                      .thenComparing(Person::name));               // при равенстве — по имени
System.out.println(people);
// выведет: [Person[name=Борис, age=19], Person[name=Ян, age=19], Person[name=Аня, age=20], Person[name=Оля, age=20]]
\`\`\`

Полезные методы: \`Comparator.comparing(функция)\`, \`comparingInt\`, \`thenComparing\`, \`reversed()\`, \`Comparator.naturalOrder()\`, \`Comparator.reverseOrder()\`, \`Comparator.nullsFirst(...)\`. Запись \`Person::age\` — ссылка на метод, сокращение для \`p -> p.age()\`.

> ⚠️ **Подвох: reversed() разворачивает всю цепочку.** \`comparingInt(Person::age).thenComparing(Person::name).reversed()\` отсортирует по убыванию **и** возраста, **и** имени. Чтобы по убыванию возраста, но по возрастанию имени: \`comparingInt(Person::age).reversed().thenComparing(Person::name)\`.

## record: всё это — автоматически

\`\`\`java
record Point(int x, int y) { }

Point a = new Point(1, 2);
Point b = new Point(1, 2);
System.out.println(a);           // выведет: Point[x=1, y=2]
System.out.println(a.equals(b)); // выведет: true
System.out.println(a == b);      // выведет: false
System.out.println(a.hashCode() == b.hashCode()); // выведет: true
\`\`\`

Для \`record\` компилятор сам генерирует \`equals\`, \`hashCode\` и \`toString\` по всем компонентам — согласованно и без ошибок. Это идеальный выбор для классов-значений и ключей \`HashMap\`. Подробнее о record — в уроке 12.

## Шпаргалка

- \`==\` — один и тот же объект; \`equals\` — логически равны. Без переопределения equals = \`==\`.
- Контракт equals: рефлексивность, симметричность, транзитивность, согласованность, \`x.equals(null) == false\`.
- Шаблон: \`this == o\` → \`null\`/класс → приведение → сравнение полей (\`Double.compare\`, \`Objects.equals\`).
- Параметр equals — \`Object\`; ставьте \`@Override\`.
- Равные объекты обязаны иметь равные \`hashCode\`; обратное не обязательно.
- equals без hashCode ломает \`HashSet\`/\`HashMap\`. Изменяемые ключи — тоже.
- \`compareTo\`: знак результата; используйте \`Integer.compare\`, а не вычитание; \`TreeSet\` сравнивает через compareTo.
- \`Comparator.comparing(...).thenComparing(...)\`; \`reversed()\` действует на всю цепочку слева от него.
- record генерирует equals/hashCode/toString сам.`,
  tasks: [
    {
      type: 'choice',
      q: `Класс \`Point\` не переопределяет \`toString()\`. Что примерно выведет \`System.out.println(new Point(1, 2));\`?`,
      options: [
        '`Point@` и шестнадцатеричное число, например `Point@1b6d3586`',
        '`Point(1, 2)`',
        '`Point[x=1, y=2]`',
        'Ошибка компиляции: у `Point` нет `toString()`',
      ],
      answer: '`Point@` и шестнадцатеричное число, например `Point@1b6d3586`',
      explain: '`toString()` есть у всех — он унаследован от `Object`: имя класса + `@` + хэш-код в шестнадцатеричном виде. Формат `Point[x=1, y=2]` генерируется только для `record`.',
    },
    {
      type: 'input',
      q: `Что выведет программа? (\`equals\` в \`Point\` **не** переопределён)
\`\`\`java
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}
public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);
        Point c = a;
        System.out.println((a == b) + " " + a.equals(b) + " " + (a == c));
    }
}
\`\`\``,
      answer: ['false false true'],
      explain: '`a` и `b` — разные объекты. `Object.equals` по умолчанию сравнивает ссылки, поэтому тоже `false`. `c = a` копирует ссылку — это тот же объект.',
    },
    {
      type: 'match',
      q: 'Соедините свойство контракта `equals` и его формулировку',
      pairs: [
        ['Рефлексивность', '`x.equals(x)` — всегда `true`'],
        ['Симметричность', '`x.equals(y)` возвращает то же, что `y.equals(x)`'],
        ['Транзитивность', 'Из `x.equals(y)` и `y.equals(z)` следует `x.equals(z)`'],
        ['Согласованность', 'Повторные вызовы дают тот же результат, пока объекты не изменились'],
        ['Сравнение с null', '`x.equals(null)` — `false` для любого не-null `x`'],
      ],
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
import java.util.*;

class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    public boolean equals(Point p) { return x == p.x && y == p.y; }
    public int hashCode() { return 31 * x + y; }
}
public class Main {
    public static void main(String[] args) {
        List<Point> list = new ArrayList<>();
        list.add(new Point(1, 2));
        Point q = new Point(1, 2);
        System.out.println(q.equals(list.get(0)) + " " + list.contains(q));
    }
}
\`\`\``,
      answer: ['true false'],
      hint: 'Посмотрите внимательно на тип параметра `equals`.',
      explain: '`equals(Point p)` — это **перегрузка**, а не переопределение `equals(Object)`. Прямой вызов с аргументом типа `Point` выбирает её → `true`. А `ArrayList.contains` вызывает `equals(Object)`, который остался от `Object` и сравнивает ссылки → `false`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт, если в предыдущей задаче поставить `@Override` над `public boolean equals(Point p)`?',
      options: [
        'Ошибка компиляции: метод ничего не переопределяет',
        'Метод станет переопределением, и `contains` вернёт `true`',
        'Ничего не изменится: `@Override` — просто комментарий',
        'Ошибка при выполнении: `ClassCastException`',
      ],
      answer: 'Ошибка компиляции: метод ничего не переопределяет',
      explain: '`@Override` просит компилятор проверить, что метод действительно переопределяет метод предка. `equals(Point)` не совпадает по сигнатуре с `equals(Object)` — ошибка *does not override or implement a method from a supertype*. Именно ради таких ошибок аннотацию и ставят.',
    },
    {
      type: 'input',
      q: `Что выведет программа? (\`equals\` переопределён правильно, \`hashCode\` — **нет**)
\`\`\`java
import java.util.*;

class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
}
public class Main {
    public static void main(String[] args) {
        Set<Point> set = new HashSet<>();
        set.add(new Point(1, 2));
        set.add(new Point(1, 2));
        set.add(new Point(1, 2));
        System.out.println(set.size());
    }
}
\`\`\``,
      answer: ['3'],
      explain: '`HashSet` сначала ищет корзину по `hashCode()`. `Object.hashCode()` у трёх разных объектов (почти наверняка) разный, поэтому они попадают в разные корзины, и `equals` даже не вызывается. Множество хранит три «равных» объекта. Нарушено правило: равные объекты обязаны иметь равные хэш-коды.',
    },
    {
      type: 'choice',
      q: 'Какие утверждения о `hashCode` **верны**? Выберите все.',
      options: [
        'Если `a.equals(b)`, то `a.hashCode() == b.hashCode()`',
        'Если `a.hashCode() == b.hashCode()`, то `a.equals(b)`',
        'Неравные объекты могут иметь одинаковый хэш-код',
        'Если объекты не равны, их хэш-коды обязаны различаться',
        'Пока поля из equals не меняются, hashCode возвращает одно и то же число',
        'Реализация `return 42;` нарушает контракт hashCode',
      ],
      answer: [
        'Если `a.equals(b)`, то `a.hashCode() == b.hashCode()`',
        'Неравные объекты могут иметь одинаковый хэш-код',
        'Пока поля из equals не меняются, hashCode возвращает одно и то же число',
      ],
      explain: 'Совпадение хэшей — коллизия, это нормально (`"Aa"` и `"BB"` имеют хэш 2112). `return 42;` контракт **не нарушает** (равные объекты — равные хэши), просто делает хэш-таблицу очень медленной: всё в одной корзине.',
    },
    {
      type: 'gaps',
      q: 'Допишите корректные `equals` и `hashCode` для класса `Book`.',
      text: `import java.util.Objects;

class Book {
    private final String title;
    private final int year;

    Book(String title, int year) {
        this.title = title;
        this.year = year;
    }

    @Override
    public boolean [equals]([Object] o) {
        if ([this] == o) return true;
        if (o == [null] || getClass() != o.[getClass]()) return false;
        Book other = ([Book]) o;
        return year == other.year && Objects.[equals](title, other.title);
    }

    @Override
    public int [hashCode]() {
        return Objects.[hash](title, year);
    }
}`,
      code: true,
      caseSensitive: true,
      explain: 'Параметр — `Object`, иначе это перегрузка. `Objects.equals` безопасен, если `title` равен `null`. `hashCode` строится по тем же полям, что и `equals`.',
    },
    {
      type: 'choice',
      q: `Что выведет программа и что не так с этим кодом?
\`\`\`java
class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }
    @Override public int hashCode() { return 31 * x + y; }
}
class ColorPoint extends Point {
    final String color;
    ColorPoint(int x, int y, String color) { super(x, y); this.color = color; }
    @Override public boolean equals(Object o) {
        if (!(o instanceof ColorPoint)) return false;
        ColorPoint cp = (ColorPoint) o;
        return super.equals(cp) && color.equals(cp.color);
    }
}
public class Main {
    public static void main(String[] args) {
        Point p = new Point(1, 2);
        ColorPoint cp = new ColorPoint(1, 2, "red");
        System.out.println(p.equals(cp) + " " + cp.equals(p));
    }
}
\`\`\``,
      options: [
        '`true false` — нарушена симметричность',
        '`true false` — нарушена транзитивность',
        '`true true` — всё корректно',
        '`false false` — всё корректно',
      ],
      answer: '`true false` — нарушена симметричность',
      explain: '`p.equals(cp)`: `cp instanceof Point` — да, координаты совпали → `true`. `cp.equals(p)`: `p instanceof ColorPoint` — нет → `false`. Результат зависит от того, у кого вызвали — это нарушение симметричности. Решения: `getClass()` вместо `instanceof`, `final`-класс, или композиция вместо наследования.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
import java.util.*;

class Box {
    int size;
    Box(int size) { this.size = size; }
    @Override public boolean equals(Object o) {
        return o instanceof Box b && b.size == size;
    }
    @Override public int hashCode() { return Objects.hash(size); }
}
public class Main {
    public static void main(String[] args) {
        Set<Box> set = new HashSet<>();
        Box b = new Box(1);
        set.add(b);
        System.out.print(set.contains(b) + " ");
        b.size = 2;
        System.out.println(set.contains(b) + " " + set.size());
    }
}
\`\`\``,
      answer: ['true false 1'],
      explain: 'После `b.size = 2` хэш-код объекта изменился, а сам объект остался в корзине, вычисленной по старому хэшу. `contains` ищет в новой корзине и не находит — хотя объект в множестве лежит (`size()` = 1). Ключи хэш-коллекций должны быть неизменяемыми.',
    },
    {
      type: 'choice',
      q: 'Как правильно сравнивать в `equals` поля типа `double`?',
      options: [
        '`Double.compare(price, other.price) == 0`',
        '`price == other.price`',
        '`price.equals(other.price)`',
        '`Math.abs(price - other.price) < 0.001`',
      ],
      answer: '`Double.compare(price, other.price) == 0`',
      explain: '`==` для `double` даёт `Double.NaN == Double.NaN` → `false` (нарушается рефлексивность) и считает `0.0 == -0.0`. `Double.compare` обрабатывает эти случаи согласованно с `Double.hashCode`. У примитива `double` нет методов, поэтому `price.equals(...)` не скомпилируется. Сравнение с допуском нарушает транзитивность.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
import java.util.Objects;

public class Main {
    public static void main(String[] args) {
        String s = null;
        System.out.println(Objects.equals(s, null) + " " + Objects.equals("a", s) + " " + Objects.hashCode(s));
    }
}
\`\`\``,
      answer: ['true false 0'],
      explain: '`Objects.equals(a, b)` — `true`, если оба `null`, иначе `a != null && a.equals(b)`; NPE не бывает. `Objects.hashCode(null)` возвращает 0.',
    },
    {
      type: 'order',
      q: 'Расставьте по порядку, что делает `HashMap.get(key)`',
      items: [
        'Вызывает `key.hashCode()`',
        'По хэшу выбирает корзину (bucket)',
        'Сравнивает ключи в этой корзине с `key` через `equals`',
        'Возвращает значение найденного ключа или `null`',
      ],
      join: ' → ',
      explain: 'Поэтому `equals` без `hashCode` не работает: равный ключ лежит в другой корзине, и до `equals` дело не доходит.',
    },
    {
      type: 'choice',
      q: '`a.compareTo(b)` вернул `-7`. Что это значит?',
      options: [
        '`a` меньше `b` и при сортировке по возрастанию идёт раньше',
        '`a` больше `b` на 7',
        '`a` меньше `b` ровно на 7',
        'Произошла ошибка сравнения',
      ],
      answer: '`a` меньше `b` и при сортировке по возрастанию идёт раньше',
      explain: 'Значение имеет только знак: отрицательное — меньше, 0 — равны, положительное — больше. Величина числа ничего не означает.',
    },
    {
      type: 'choice',
      q: `Чем опасна такая реализация?
\`\`\`java
@Override
public int compareTo(Account other) {
    return this.balance - other.balance;   // balance — int
}
\`\`\``,
      options: [
        'При больших по модулю значениях разность переполняется и даёт неверный знак',
        'Ничем, это стандартный и надёжный способ',
        'Ошибка компиляции: compareTo должен возвращать только -1, 0 или 1',
        'Она нарушает правило: compareTo должен бросать исключение для равных объектов',
      ],
      answer: 'При больших по модулю значениях разность переполняется и даёт неверный знак',
      explain: 'Например, `Integer.MIN_VALUE - 1` = `2147483647` — положительное число, хотя первое значение меньше. Пишите `Integer.compare(this.balance, other.balance)`.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
import java.util.*;

class Person implements Comparable<Person> {
    final String name;
    final int id;
    Person(String name, int id) { this.name = name; this.id = id; }
    @Override public int compareTo(Person o) { return name.compareTo(o.name); }
}
public class Main {
    public static void main(String[] args) {
        Set<Person> set = new TreeSet<>();
        set.add(new Person("Аня", 1));
        set.add(new Person("Аня", 2));
        set.add(new Person("Борис", 3));
        System.out.println(set.size());
    }
}
\`\`\``,
      answer: ['2'],
      explain: '`TreeSet` считает элементы одинаковыми, если `compareTo` вернул 0 — `equals` он не вызывает вовсе. Две разные Ани для него «одна и та же», вторая не добавится. Поэтому compareTo желательно делать согласованным с equals (например, сравнивать ещё и `id`).',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
import java.math.BigDecimal;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        BigDecimal a = new BigDecimal("1.0");
        BigDecimal b = new BigDecimal("1.00");
        Set<BigDecimal> hash = new HashSet<>(List.of(a, b));
        Set<BigDecimal> tree = new TreeSet<>(List.of(a, b));
        System.out.println(hash.size() + " " + tree.size());
    }
}
\`\`\``,
      answer: ['2 1'],
      explain: '`BigDecimal.equals` учитывает масштаб (1.0 и 1.00 — разные), а `compareTo` сравнивает только значение (равны). `HashSet` опирается на `equals`/`hashCode`, `TreeSet` — на `compareTo`. Пример из JDK, где compareTo не согласован с equals.',
    },
    {
      type: 'input',
      q: `Что выведет программа? Запишите имена через пробел.
\`\`\`java
import java.util.*;

record Person(String name, int age) { }

public class Main {
    public static void main(String[] args) {
        List<Person> people = new ArrayList<>(List.of(
                new Person("Оля", 20), new Person("Ян", 19),
                new Person("Аня", 20), new Person("Борис", 19)));
        people.sort(Comparator.comparingInt(Person::age)
                              .thenComparing(Person::name)
                              .reversed());
        for (Person p : people) System.out.print(p.name() + " ");
    }
}
\`\`\``,
      answer: ['Оля Аня Ян Борис'],
      explain: 'Без `reversed()` порядок был бы: Борис, Ян (19), Аня, Оля (20). `reversed()` разворачивает **всю** цепочку — и возраст, и имя: Оля, Аня, Ян, Борис.',
    },
    {
      type: 'choice',
      q: 'Нужно отсортировать людей по **убыванию** возраста, а при равном возрасте — по имени **по алфавиту**. Какой компаратор подходит?',
      options: [
        '`Comparator.comparingInt(Person::age).reversed().thenComparing(Person::name)`',
        '`Comparator.comparingInt(Person::age).thenComparing(Person::name).reversed()`',
        '`Comparator.comparingInt(Person::age).thenComparing(Person::name, Comparator.reverseOrder())`',
        '`Comparator.comparing(Person::name).thenComparingInt(Person::age).reversed()`',
      ],
      answer: '`Comparator.comparingInt(Person::age).reversed().thenComparing(Person::name)`',
      explain: '`reversed()` разворачивает всё, что слева от него. Поставив его сразу после возраста, мы развернули только возраст, а `thenComparing(name)` добавлен уже после — по возрастанию. Второй вариант развернёт и имена, третий — развернёт только имена, четвёртый сортирует в первую очередь по имени.',
    },
    {
      type: 'input',
      q: `Что выведет программа?
\`\`\`java
record Point(int x, int y) { }

public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);
        System.out.println(a + " " + a.equals(b) + " " + (a == b));
    }
}
\`\`\``,
      answer: ['Point[x=1, y=2] true false'],
      explain: 'record автоматически генерирует `toString` в формате `Имя[компонент=значение, ...]` и `equals`/`hashCode` по всем компонентам. Но `==` по-прежнему сравнивает ссылки: это два разных объекта.',
    },
    {
      type: 'flashcard',
      front: 'Контракт `equals` — пять свойств',
      back: '1. **Рефлексивность:** `x.equals(x)` — true.\n2. **Симметричность:** `x.equals(y) == y.equals(x)`.\n3. **Транзитивность:** `x.equals(y)` и `y.equals(z)` ⇒ `x.equals(z)`.\n4. **Согласованность:** повторные вызовы дают тот же результат, пока объекты не менялись.\n5. `x.equals(null)` — false.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Почему, переопределив `equals`, нужно переопределить и `hashCode`?',
      back: 'Контракт: равные по `equals` объекты обязаны иметь равные `hashCode`. `HashSet`/`HashMap` сначала ищут корзину по хэшу и лишь внутри неё вызывают `equals`. С хэшем от `Object` равные объекты окажутся в разных корзинах — множество хранит дубликаты, `contains` и `get` их не находят.',
      write: true,
    },
    {
      type: 'flashcard',
      front: '`Comparable` vs `Comparator`',
      back: '**Comparable<T>** — «естественный» порядок *внутри* класса: метод `compareTo(T other)`, один на класс. Используется в `Collections.sort(list)`, `TreeSet`.\n\n**Comparator<T>** — *внешнее* правило сравнения: метод `compare(T a, T b)`. Их может быть сколько угодно; подходит для чужих классов; удобно строить через `Comparator.comparing(...).thenComparing(...).reversed()`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: `Напишите неизменяемый класс \`Money\` с полями \`long amount\` (в копейках) и \`String currency\`. Переопределите \`equals\`, \`hashCode\` и \`toString\` (формат \`1500 RUB\`). Проверьте в \`main\`: два объекта \`new Money(1500, "RUB")\` равны, а \`HashSet\` из трёх объектов (два одинаковых и один \`new Money(1500, "USD")\`) имеет размер 2.`,
      starter: `import java.util.*;

final class Money {
    private final long amount;
    private final String currency;

    Money(long amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }

    // equals, hashCode, toString
}

public class Main {
    public static void main(String[] args) {
        // ...
    }
}`,
      solution: `import java.util.*;

final class Money {
    private final long amount;
    private final String currency;

    Money(long amount, String currency) {
        this.amount = amount;
        this.currency = Objects.requireNonNull(currency);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money m)) return false;   // класс final — instanceof безопасен
        return amount == m.amount && currency.equals(m.currency);
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
        Money a = new Money(1500, "RUB");
        Money b = new Money(1500, "RUB");
        Money c = new Money(1500, "USD");
        System.out.println(a.equals(b));         // true
        System.out.println(a == b);              // false
        Set<Money> set = new HashSet<>(List.of(a, c));
        set.add(b);
        System.out.println(set.size());          // 2
        System.out.println(set.contains(new Money(1500, "RUB"))); // true
        System.out.println(a);                   // 1500 RUB
    }
}`,
      explain: 'Класс `final`, поэтому проверка через `instanceof` не нарушит симметричность. `hashCode` использует ровно те же поля, что `equals`. Неизменяемость делает объект безопасным ключом хэш-коллекций.',
    },
    {
      type: 'code',
      lang: 'java',
      q: `Класс \`Student\` (имя, группа, средний балл \`double\`) реализует \`Comparable<Student>\`: естественный порядок — по имени. В \`main\` отсортируйте список студентов: 1) естественным порядком; 2) компаратором — по группе по возрастанию, внутри группы — по баллу по убыванию. Выведите оба результата.`,
      starter: `import java.util.*;

class Student implements Comparable<Student> {
    // ...
}

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<>(List.of(
                new Student("Оля", "ИВТ-1", 4.5),
                new Student("Ян", "ИВТ-2", 4.9),
                new Student("Аня", "ИВТ-1", 4.8),
                new Student("Борис", "ИВТ-2", 3.7)));
        // ...
    }
}`,
      solution: `import java.util.*;

class Student implements Comparable<Student> {
    private final String name;
    private final String group;
    private final double avg;

    Student(String name, String group, double avg) {
        this.name = name;
        this.group = group;
        this.avg = avg;
    }

    public String getName() { return name; }
    public String getGroup() { return group; }
    public double getAvg() { return avg; }

    @Override
    public int compareTo(Student other) {
        return name.compareTo(other.name);
    }

    @Override
    public String toString() {
        return name + "(" + group + ", " + avg + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<>(List.of(
                new Student("Оля", "ИВТ-1", 4.5),
                new Student("Ян", "ИВТ-2", 4.9),
                new Student("Аня", "ИВТ-1", 4.8),
                new Student("Борис", "ИВТ-2", 3.7)));

        Collections.sort(list);
        System.out.println(list);
        // [Аня(ИВТ-1, 4.8), Борис(ИВТ-2, 3.7), Оля(ИВТ-1, 4.5), Ян(ИВТ-2, 4.9)]

        list.sort(Comparator.comparing(Student::getGroup)
                .thenComparing(Comparator.comparingDouble(Student::getAvg).reversed()));
        System.out.println(list);
        // [Аня(ИВТ-1, 4.8), Оля(ИВТ-1, 4.5), Ян(ИВТ-2, 4.9), Борис(ИВТ-2, 3.7)]
    }
}`,
      explain: '`reversed()` применён только к компаратору по баллу, который передан в `thenComparing` — поэтому группа сортируется по возрастанию, а балл внутри группы — по убыванию.',
    },
  ],
});
