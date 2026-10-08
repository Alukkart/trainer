Trainer.add({
  id: 'java-13-exceptions',
  title: 'Java 13. Исключения',
  subject: 'Java',
  description: 'Иерархия Throwable, checked и unchecked, try/catch/finally, try-with-resources, собственные исключения и подвохи с return в finally.',
  lesson: `
## Что такое исключение и зачем оно нужно

Программа постоянно сталкивается с ситуациями, когда «дальше нормально работать нельзя»: файла нет, пользователь ввёл \`abc\` вместо числа, делим на ноль, обращаемся к объекту через \`null\`. В языке C функции в таких случаях возвращали код ошибки (например, \`-1\`), и его было очень легко забыть проверить — программа молча продолжала работать с мусором.

В Java для этого есть **исключения** (exceptions). Метод, обнаруживший проблему, **выбрасывает** (throws) объект-исключение. Обычное выполнение сразу прерывается, и исключение «всплывает» вверх по стеку вызовов — от метода к тому, кто его вызвал, — пока кто-нибудь его не **перехватит** (catch). Если не перехватил никто, программа завершается и печатает **stack trace** (трассировку стека).

💡 Аналогия: курьер не может вручить посылку — адресата нет. Он не выбрасывает посылку молча в кусты, а возвращает её отправителю с запиской «почему не доставлено». Объект-исключение и есть такая записка: в нём **тип** проблемы, **сообщение** и **место**, где она возникла.

\`\`\`java
public class Main {
    public static void main(String[] args) {
        int a = 10, b = 0;
        System.out.println("До деления");
        int c = a / b;
        System.out.println("После деления: " + c);
    }
}
// выведет:
// До деления
// Exception in thread "main" java.lang.ArithmeticException: / by zero
//     at Main.main(Main.java:5)
\`\`\`

Строка «После деления» не напечатается: исключение прервало \`main\`, его никто не поймал, и программа аварийно завершилась.

### Как читать stack trace

\`\`\`java
public class Main {
    static void readConfig() { parsePort("80a"); }
    static int parsePort(String s) { return Integer.parseInt(s); }

    public static void main(String[] args) {
        readConfig();
    }
}
// Exception in thread "main" java.lang.NumberFormatException: For input string: "80a"
//     at java.base/java.lang.NumberFormatException.forInputString(...)  ← внутри библиотеки
//     at java.base/java.lang.Integer.parseInt(...)                      ← внутри библиотеки
//     at Main.parsePort(Main.java:3)        ← первая строка НАШЕГО кода
//     at Main.readConfig(Main.java:2)       ← кто вызвал parsePort
//     at Main.main(Main.java:6)             ← кто вызвал readConfig
\`\`\`

1. Первая строка — **тип** исключения и **сообщение**. Часто этого уже достаточно, чтобы понять ошибку.
2. Дальше идут строки \`at …\` — стек вызовов **сверху вниз**: сверху — место, где исключение возникло, ниже — кто вызывал.
3. Ищите первую строку, относящуюся к **вашему** коду, — там и номер строки, с которой начинать отладку.

## Иерархия исключений

Все исключения — это объекты классов, унаследованных от \`Throwable\`:

\`\`\`
Throwable
├── Error                          серьёзные сбои JVM — обычно не ловят
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception                      проверяемые (checked)...
    ├── IOException
    │   └── FileNotFoundException
    ├── InterruptedException
    ├── CloneNotSupportedException
    └── RuntimeException           ...кроме этой ветки — непроверяемые (unchecked)
        ├── ArithmeticException
        ├── NullPointerException
        ├── ClassCastException
        ├── IllegalStateException
        ├── UnsupportedOperationException
        ├── IllegalArgumentException
        │   └── NumberFormatException
        └── IndexOutOfBoundsException
            └── ArrayIndexOutOfBoundsException
\`\`\`

| Исключение | Когда возникает |
|---|---|
| \`ArithmeticException\` | целочисленное деление на ноль: \`5 / 0\`, \`5 % 0\` |
| \`NullPointerException\` | вызов метода или обращение к полю через \`null\` |
| \`ArrayIndexOutOfBoundsException\` | индекс массива вне диапазона \`0..length-1\` |
| \`ClassCastException\` | неверное нисходящее приведение: \`(String) obj\`, где внутри \`Integer\` |
| \`NumberFormatException\` | \`Integer.parseInt("12a")\` |
| \`IllegalArgumentException\` | метод получил недопустимый аргумент (бросаем сами при проверке) |
| \`IllegalStateException\` | объект в неподходящем состоянии (например, заказ уже оплачен) |
| \`StackOverflowError\` | бесконечная (или слишком глубокая) рекурсия |

> ⚠️ Подвох: деление на ноль **с плавающей точкой** исключения не бросает! \`10 / 0.0\` даёт \`Infinity\`, а \`10.0 % 0\` — \`NaN\`. \`ArithmeticException\` бывает только при целочисленных \`/\` и \`%\`.

## Checked и unchecked исключения

Это главное разделение, которое любят спрашивать на контрольных.

- **Checked (проверяемые)** — \`Exception\` и все его потомки, **кроме** ветки \`RuntimeException\`. Например, \`IOException\`, \`InterruptedException\`. Для них компилятор требует правило **«поймай или объяви»**: метод, в котором такое исключение может возникнуть, обязан либо обработать его в \`try/catch\`, либо объявить в сигнатуре через \`throws\`. Иначе — **ошибка компиляции**.
- **Unchecked (непроверяемые)** — \`RuntimeException\` с потомками и \`Error\` с потомками. Компилятор ничего не требует: ловить и объявлять их можно, но не обязательно.

Зачем такое деление? Checked-исключения описывают ситуации, которые **не зависят от программиста**, но которые корректная программа должна предусмотреть: файл удалили, сеть пропала, поток прервали. Unchecked — это обычно **ошибки в самом коде** (\`null\`, неверный индекс, неверный аргумент): их надо не ловить, а исправлять.

\`\`\`java
static void pause() {
    Thread.sleep(100);   // ошибка компиляции:
}                        // unreported exception InterruptedException;
                         // must be caught or declared to be thrown
\`\`\`

Два способа исправить:

\`\`\`java
// 1. Поймать
static void pause() {
    try {
        Thread.sleep(100);
    } catch (InterruptedException e) {
        System.out.println("Прервали");
    }
}

// 2. Объявить — тогда «поймай или объяви» становится заботой вызывающего метода
static void pause() throws InterruptedException {
    Thread.sleep(100);
}
\`\`\`

> ⚠️ Подвох: если \`pause()\` объявляет \`throws InterruptedException\`, то и \`main\`, который вызывает \`pause()\`, теперь должен либо поймать это исключение, либо тоже написать \`throws InterruptedException\`. Иначе ошибка компиляции переедет в \`main\`.

> 💡 Запомни: проверка checked-исключений — это работа **компилятора**. Для JVM во время выполнения все исключения одинаковы.

## try / catch / finally

\`\`\`java
try {
    // код, который может выбросить исключение
} catch (ТипИсключения1 e) {
    // обработка
} catch (ТипИсключения2 e) {
    // обработка
} finally {
    // выполняется ВСЕГДА — было исключение или нет
}
\`\`\`

Как идёт выполнение:

1. Исключения нет — все \`catch\` пропускаются, выполняется \`finally\`, затем код после блока.
2. Исключение в \`try\` — **остаток \`try\` пропускается**, выбирается **первый** \`catch\`, тип которого подходит (сам класс или его предок), затем \`finally\`, затем код после блока.
3. Ни один \`catch\` не подошёл — выполняется \`finally\`, а исключение летит дальше, к вызывающему методу.

\`\`\`java
try {
    System.out.println("1");
    int c = 10 / 0;
    System.out.println("2");          // пропускается
} catch (ArithmeticException e) {
    System.out.println("Ошибка: " + e.getMessage());
}
System.out.println("3");
// выведет:
// 1
// Ошибка: / by zero
// 3
\`\`\`

Можно писать \`try\` + \`catch\`, \`try\` + \`finally\` или все три части. Обычный \`try\` без \`catch\` и \`finally\` — ошибка компиляции (исключение — try-with-resources, о нём ниже).

### Порядок catch: от частного к общему

Блоки \`catch\` проверяются **сверху вниз**. Если первым стоит общий тип, то следующий за ним частный тип недостижим — и компилятор это запрещает:

\`\`\`java
try {
    int x = Integer.parseInt("12a");
} catch (RuntimeException e) {
    System.out.println("runtime");
} catch (NumberFormatException e) {   // ошибка компиляции:
    System.out.println("format");     // exception NumberFormatException has already been caught
}
\`\`\`

Правильно: сначала \`NumberFormatException\`, потом \`RuntimeException\`.

> ⚠️ Подвох: нельзя ловить **checked**-исключение, которое в \`try\` заведомо не может возникнуть: \`try { System.out.println("Hi"); } catch (IOException e) {}\` — ошибка компиляции «exception IOException is never thrown». А вот \`catch (Exception e)\`, \`catch (Throwable e)\` и любые unchecked-исключения ловить можно всегда.

### Multi-catch

Если обработка одинаковая, несколько типов можно перечислить через вертикальную черту:

\`\`\`java
static int parseAndDivide(String a, String b) {
    try {
        return Integer.parseInt(a) / Integer.parseInt(b);
    } catch (NumberFormatException | ArithmeticException e) {
        System.out.println("Плохие данные: " + e.getMessage());
        return 0;
    }
}
// parseAndDivide("10", "0")   → Плохие данные: / by zero, вернёт 0
// parseAndDivide("ten", "2")  → Плохие данные: For input string: "ten", вернёт 0
\`\`\`

Правила: типы в multi-catch **не должны быть связаны наследованием** (\`FileNotFoundException | IOException\` — ошибка компиляции, ведь первое и так входит во второе), а переменная \`e\` неявно \`final\` — присвоить ей другое значение нельзя.

### Что есть у объекта исключения

\`\`\`java
try {
    Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println(e.getMessage()); // For input string: "abc"
    System.out.println(e);              // java.lang.NumberFormatException: For input string: "abc"
    e.printStackTrace();                // полный stack trace в System.err
}
\`\`\`

\`getMessage()\` — только сообщение, \`toString()\` — полное имя класса и сообщение, \`getCause()\` — исходная причина (если исключение «обёрнуто»), \`getSuppressed()\` — подавленные исключения (см. try-with-resources).

## throw и throws

| | \`throw\` | \`throws\` |
|---|---|---|
| Что это | оператор | часть объявления метода |
| Где пишется | в теле метода | после списка параметров |
| После него | **один объект**-исключение: \`throw new X(...)\` | **список типов**: \`throws A, B\` |
| Смысл | «выбрасываю сейчас» | «этот метод может выбросить» |

Самое частое применение \`throw\` — **проверка аргументов** (принцип fail fast: падаем сразу и громко, а не портим данные молча):

\`\`\`java
class Student {
    private int course;

    public void setCourse(int course) {
        if (course < 1 || course > 6) {
            throw new IllegalArgumentException("Курс должен быть от 1 до 6, получено: " + course);
        }
        this.course = course;
    }
}
// s.setCourse(9) → IllegalArgumentException: Курс должен быть от 1 до 6, получено: 9
\`\`\`

Так инкапсуляция и исключения работают вместе: объект **не позволяет** привести себя в неверное состояние.

## Собственные исключения

Свой класс исключения нужен, когда стандартные типы недостаточно точно описывают проблему предметной области и вызывающему коду важно отличить её от других. Правила:

- наследуйтесь от \`Exception\` → получится **checked**; от \`RuntimeException\` → **unchecked**;
- имя заканчивается на \`Exception\`;
- сделайте конструкторы \`(String message)\` и \`(String message, Throwable cause)\`, передавая их в \`super(...)\`;
- можно добавить поля с подробностями.

**Checked** выбирают, когда вызывающий код **может и должен** что-то сделать (предложить пополнить счёт, выбрать другой файл). **Unchecked** — когда это ошибка программиста или восстановиться всё равно нельзя. В современном коде unchecked используют чаще.

\`\`\`java
class InsufficientFundsException extends Exception {
    private final double shortage;

    public InsufficientFundsException(String message, double shortage) {
        super(message);
        this.shortage = shortage;
    }

    public double getShortage() { return shortage; }
}

class BankAccount {
    private double balance;

    BankAccount(double balance) { this.balance = balance; }

    void withdraw(double amount) throws InsufficientFundsException {
        if (amount <= 0) {
            throw new IllegalArgumentException("Сумма должна быть положительной: " + amount);
        }
        if (amount > balance) {
            throw new InsufficientFundsException("Недостаточно средств", amount - balance);
        }
        balance -= amount;
    }

    double getBalance() { return balance; }
}

// в main:
BankAccount acc = new BankAccount(100);
try {
    acc.withdraw(30);
    acc.withdraw(100);
    System.out.println("не выполнится");
} catch (InsufficientFundsException e) {
    System.out.println(e.getMessage() + ", не хватает " + e.getShortage());
}
System.out.println("Баланс: " + acc.getBalance());
// выведет:
// Недостаточно средств, не хватает 30.0
// Баланс: 70.0
\`\`\`

Обратите внимание: неверная сумма (\`-5\`) — ошибка программиста, поэтому unchecked \`IllegalArgumentException\`. Нехватка денег — нормальная бизнес-ситуация, которую вызывающий обязан обработать, поэтому checked.

### Обёртывание (цепочка причин)

Низкоуровневое исключение часто «заворачивают» в своё, понятное на уровне приложения, **сохраняя причину**:

\`\`\`java
static int readPort(String value) {
    try {
        return Integer.parseInt(value);
    } catch (NumberFormatException e) {
        throw new ConfigException("Некорректный порт: " + value, e);  // e — причина
    }
}
// e.getMessage()                          → Некорректный порт: 80a
// e.getCause().getClass().getSimpleName() → NumberFormatException
\`\`\`

## finally выполняется всегда

\`finally\` нужен для освобождения ресурсов (закрыть файл, соединение), которое должно произойти при любом исходе. Он выполняется и после нормального завершения \`try\`, и после \`catch\`, и когда исключение не поймано, и даже когда в \`try\` стоит \`return\`. Не выполнится он только в экзотических случаях: \`System.exit()\` внутри \`try\`, аварийное завершение JVM, бесконечный цикл в \`try\`.

Самые коварные вопросы — про \`return\`:

\`\`\`java
static int f() {
    int x = 1;
    try {
        return x;        // значение 1 уже вычислено и «отложено»
    } finally {
        x = 2;           // меняет переменную, но не отложенный результат
    }
}                        // f() вернёт 1

static int k() {
    try {
        return 1;
    } finally {
        return 2;        // return в finally ПЕРЕБИВАЕТ return из try
    }
}                        // k() вернёт 2

static int g() {
    try {
        throw new RuntimeException("boom");
    } finally {
        return 42;       // исключение молча ПОТЕРЯНО!
    }
}                        // g() вернёт 42, никакого исключения

static StringBuilder h() {
    StringBuilder sb = new StringBuilder("A");
    try {
        return sb;       // отложена ССЫЛКА на объект
    } finally {
        sb.append("B");  // а объект по этой ссылке меняется
    }
}                        // h() вернёт объект с текстом "AB"
\`\`\`

Похожая беда: если \`finally\` сам выбросит исключение, оно **заменит** исходное — первое исключение потеряется.

> ⚠️ Подвох: никогда не пишите \`return\` (и \`throw\`) в \`finally\` — так теряются исключения. Если в \`try\` возвращается примитив, изменение переменной в \`finally\` на результат не влияет; если ссылка — изменения объекта видны.

## try-with-resources

Раньше ресурс закрывали вручную в \`finally\` — с проверкой на \`null\` и вложенным \`try\`, потому что \`close()\` тоже может бросить исключение. С Java 7 есть короткая форма:

\`\`\`java
try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    System.out.println(reader.readLine());
} catch (IOException e) {
    System.out.println("Не удалось прочитать: " + e.getMessage());
}
// reader.close() вызовется автоматически
\`\`\`

Правила:

- ресурс должен реализовывать интерфейс \`AutoCloseable\` (или его наследника \`Closeable\`) с единственным методом \`close()\`;
- ресурсы закрываются **автоматически** и **в обратном порядке** объявления;
- закрытие происходит **до** выполнения \`catch\` и \`finally\`;
- переменные ресурсов неявно \`final\`.

\`\`\`java
class Resource implements AutoCloseable {
    private final String name;

    Resource(String name) {
        this.name = name;
        System.out.println("открыт " + name);
    }

    @Override
    public void close() {
        System.out.println("закрыт " + name);
    }
}

try (Resource file = new Resource("файл");
     Resource net = new Resource("сеть")) {
    System.out.println("работаем");
}
// выведет: открыт файл, открыт сеть, работаем, закрыт сеть, закрыт файл
\`\`\`

Если исключение бросил и блок \`try\`, и \`close()\`, то наружу выйдет исключение из \`try\`, а исключение из \`close()\` не потеряется: оно будет **подавленным** (suppressed), его можно достать через \`e.getSuppressed()\`.

## Исключения и переопределение методов

Переопределяющий метод **не может расширять** список checked-исключений родителя. Он может:

- бросать те же checked-исключения или их **подклассы** (более узкие);
- не бросать checked-исключений **вообще**;
- бросать **любые unchecked**.

\`\`\`java
class DataSource { void read() throws IOException {} }

class A extends DataSource { @Override void read() throws FileNotFoundException {} } // OK: уже
class B extends DataSource { @Override void read() {} }                             // OK: без исключений
class D extends DataSource { @Override void read() throws IllegalStateException {} } // OK: unchecked
class C extends DataSource { @Override void read() throws Exception {} }             // ОШИБКА: шире
class E extends DataSource { @Override void read() throws IOException, InterruptedException {} } // ОШИБКА: новое checked
\`\`\`

Почему? Код, работающий через ссылку на родителя (\`DataSource ds = new C();\`), готов обработать только \`IOException\`. Если бы потомок мог бросить что-то более общее, полиморфизм сломал бы обещание, данное компилятору. Это частный случай принципа подстановки Лисков (урок 15).

## Хорошие практики

- **Не глотайте исключения.** Пустой \`catch (Exception e) {}\` прячет ошибку — программа работает неправильно, а причину не найти. Минимум — залогировать, лучше — обработать или пробросить.
- **Не ловите \`Exception\` и \`Throwable\` без нужды** — заодно поймаете то, чего не ожидали (например, \`NullPointerException\` от собственного бага). \`Error\` не ловите вообще.
- **Ловите там, где можете что-то сделать** (повторить, показать сообщение, выбрать запасной вариант). Если не можете — объявите \`throws\` или оберните.
- **Не управляйте логикой через исключения**: проверить \`if (index < list.size())\` лучше, чем ловить \`IndexOutOfBoundsException\`.
- **Пишите информативные сообщения** со значениями: «Курс должен быть от 1 до 6, получено: 9», а не «Ошибка».
- **Сохраняйте причину** при обёртывании: \`new MyException("...", e)\`.
- **Ресурсы закрывайте через try-with-resources.**

## Шпаргалка

| Вопрос | Ответ |
|---|---|
| Корень иерархии | \`Throwable\` → \`Error\` и \`Exception\` |
| Checked | \`Exception\` и потомки, кроме \`RuntimeException\` |
| Unchecked | \`RuntimeException\`, \`Error\` и их потомки |
| «Поймай или объяви» | только для checked, проверяет компилятор |
| Порядок catch | от частного к общему, иначе ошибка компиляции |
| Multi-catch | типы не связаны наследованием, \`e\` — final |
| \`finally\` | выполняется всегда (кроме \`System.exit\` и краха JVM) |
| \`return\` в \`finally\` | перебивает \`return\` и исключение из \`try\` — так нельзя |
| try-with-resources | \`AutoCloseable\`, закрытие в обратном порядке, до \`catch\` |
| Переопределение | checked-исключения — те же, уже или никаких |
| Своё исключение | \`extends Exception\` (checked) или \`extends RuntimeException\` (unchecked) |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Какие из исключений являются **проверяемыми** (checked)?',
      options: ['`IOException`', '`FileNotFoundException`', '`InterruptedException`', '`NullPointerException`', '`NumberFormatException`', '`StackOverflowError`'],
      answer: ['`IOException`', '`FileNotFoundException`', '`InterruptedException`'],
      explain: 'Checked — это `Exception` и его потомки, кроме ветки `RuntimeException`. `NullPointerException` и `NumberFormatException` — потомки `RuntimeException`, а `StackOverflowError` — это `Error`; всё это unchecked.',
    },
    {
      type: 'match',
      q: 'Соедините исключение и ситуацию, в которой оно возникает',
      pairs: [
        ['`ArithmeticException`', '`int x = 7 / 0;`'],
        ['`NullPointerException`', '`String s = null; s.length();`'],
        ['`ArrayIndexOutOfBoundsException`', '`int[] a = new int[5]; a[5] = 1;`'],
        ['`ClassCastException`', '`Object o = 42; String s = (String) o;`'],
        ['`NumberFormatException`', '`Integer.parseInt("12a");`'],
        ['`StackOverflowError`', 'метод вызывает сам себя без условия выхода'],
      ],
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nSystem.out.println(10 / 0.0);\nSystem.out.println(10 / 0);\n```',
      options: [
        'Выведется `Infinity`, затем выбросится `ArithmeticException`',
        'Обе строки выбросят `ArithmeticException`',
        'Выведется `Infinity`, затем `Infinity`',
        'Выведется `0.0`, затем `0`',
      ],
      answer: 'Выведется `Infinity`, затем выбросится `ArithmeticException`',
      explain: 'Деление на ноль с плавающей точкой по стандарту IEEE 754 даёт `Infinity` (или `NaN` для `0.0 / 0`). `ArithmeticException` бросают только целочисленные `/` и `%`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    public static void main(String[] args) {\n        try {\n            System.out.print("A");\n            int[] arr = new int[3];\n            arr[3] = 1;\n            System.out.print("B");\n        } catch (ArrayIndexOutOfBoundsException e) {\n            System.out.print("C");\n        } finally {\n            System.out.print("D");\n        }\n        System.out.print("E");\n    }\n}\n```',
      answer: ['ACDE'],
      explain: 'После исключения в строке `arr[3] = 1` остаток `try` (печать `B`) пропускается, срабатывает `catch` (`C`), затем `finally` (`D`). Исключение обработано, поэтому выполнение продолжается после блока (`E`).',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    static void test() {\n        try {\n            System.out.print("1");\n            String s = null;\n            s.length();\n            System.out.print("2");\n        } catch (ArithmeticException e) {\n            System.out.print("3");\n        } finally {\n            System.out.print("4");\n        }\n        System.out.print("5");\n    }\n\n    public static void main(String[] args) {\n        try {\n            test();\n        } catch (RuntimeException e) {\n            System.out.print("6");\n        }\n        System.out.print("7");\n    }\n}\n```',
      answer: ['1467'],
      hint: 'Подходит ли `catch (ArithmeticException e)` для `NullPointerException`?',
      explain: 'В `test()` возникает `NullPointerException`. `catch (ArithmeticException)` не подходит, поэтому выполняется только `finally` (`4`), а исключение уходит в `main` — `5` не печатается. В `main` его ловит `catch (RuntimeException)` (`6`), затем печатается `7`.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт при компиляции и запуске?\n```java\ntry {\n    int x = Integer.parseInt("12a");\n} catch (RuntimeException e) {\n    System.out.println("runtime");\n} catch (NumberFormatException e) {\n    System.out.println("format");\n}\n```',
      options: [
        'Ошибка компиляции',
        'Выведет `runtime`',
        'Выведет `format`',
        'Выведет `runtime` и `format`',
      ],
      answer: 'Ошибка компиляции',
      explain: '`NumberFormatException` — потомок `RuntimeException`, поэтому второй `catch` недостижим: javac сообщает «exception NumberFormatException has already been caught». Блоки `catch` пишут от частного к общему.',
    },
    {
      type: 'choice',
      q: 'Код не компилируется: «unreported exception InterruptedException». Какие исправления помогут? (Выберите все верные)\n```java\npublic class Main {\n    static void pause() {\n        Thread.sleep(100);\n    }\n    public static void main(String[] args) {\n        pause();\n    }\n}\n```',
      options: [
        'Обернуть `Thread.sleep(100)` в `try { ... } catch (InterruptedException e) { ... }`',
        'Добавить `throws InterruptedException` и к `pause()`, и к `main`',
        'Добавить `throws InterruptedException` только к `pause()`',
        'Добавить `throws RuntimeException` к `pause()`',
        'Обернуть `Thread.sleep(100)` в `try { ... } catch (RuntimeException e) { ... }`',
      ],
      answer: [
        'Обернуть `Thread.sleep(100)` в `try { ... } catch (InterruptedException e) { ... }`',
        'Добавить `throws InterruptedException` и к `pause()`, и к `main`',
      ],
      explain: '`InterruptedException` — checked, нужно «поймать или объявить». Если объявить его только у `pause()`, ошибка переедет в `main`, который вызывает `pause()`. `RuntimeException` здесь ни при чём: он не является ни предком, ни потомком `InterruptedException`.',
    },
    {
      type: 'choice',
      q: 'Какие строки **скомпилируются**? (`IOException` импортирован)',
      options: [
        '`try { System.out.println("Hi"); } catch (Exception e) { }`',
        '`try { System.out.println("Hi"); } catch (IllegalStateException e) { }`',
        '`try { System.out.println("Hi"); } catch (Throwable e) { }`',
        '`try { System.out.println("Hi"); } catch (IOException e) { }`',
      ],
      answer: [
        '`try { System.out.println("Hi"); } catch (Exception e) { }`',
        '`try { System.out.println("Hi"); } catch (IllegalStateException e) { }`',
        '`try { System.out.println("Hi"); } catch (Throwable e) { }`',
      ],
      explain: 'Нельзя ловить checked-исключение, которое в `try` не может возникнуть: «exception IOException is never thrown in body of corresponding try statement». Unchecked-исключения, а также `Exception` и `Throwable` (они включают и unchecked) ловить можно всегда.',
    },
    {
      type: 'input',
      q: 'Что вернёт `f()`?\n```java\nstatic int f() {\n    int x = 1;\n    try {\n        return x;\n    } finally {\n        x = 2;\n    }\n}\n```',
      answer: ['1'],
      explain: 'При выполнении `return x` значение `1` уже вычислено и сохранено как результат. `finally` выполняется, но меняет только локальную переменную, а не отложенный результат.',
    },
    {
      type: 'choice',
      q: 'Что выведет `System.out.println(g());`?\n```java\nstatic int g() {\n    try {\n        throw new RuntimeException("boom");\n    } finally {\n        return 42;\n    }\n}\n```',
      options: [
        '`42`',
        'Программа завершится с `RuntimeException: boom`',
        'Ошибка компиляции: после `throw` нельзя писать `finally`',
        'Сначала `42`, потом stack trace',
      ],
      answer: '`42`',
      explain: '`return` в `finally` перебивает всё, что происходило в `try`, — даже летящее исключение. Оно молча теряется. Именно поэтому `return` в `finally` считается грубой ошибкой (javac с `-Xlint` предупреждает: «finally clause cannot complete normally»).',
    },
    {
      type: 'choice',
      q: 'Что выведет `System.out.println(h());`?\n```java\nstatic StringBuilder h() {\n    StringBuilder sb = new StringBuilder("A");\n    try {\n        return sb;\n    } finally {\n        sb.append("B");\n    }\n}\n```',
      options: ['`AB`', '`A`', '`B`', 'Ошибка компиляции'],
      answer: '`AB`',
      explain: 'Отложенным результатом стала **ссылка** на объект `StringBuilder`. `finally` меняет сам объект, поэтому вызывающий видит `AB`. Сравните с примитивом `int`: там изменение переменной в `finally` на результат не влияет.',
    },
    {
      type: 'order',
      q: 'Класс `Res` печатает `open <имя>` в конструкторе и `close <имя>` в `close()`. Расставьте строки вывода в правильном порядке.\n```java\ntry (Res a = new Res("A"); Res b = new Res("B")) {\n    System.out.println("body");\n    throw new IllegalStateException("fail");\n} catch (IllegalStateException e) {\n    System.out.println("catch " + e.getMessage());\n} finally {\n    System.out.println("finally");\n}\n```',
      items: ['open A', 'open B', 'body', 'close B', 'close A', 'catch fail', 'finally'],
      join: '\n',
      explain: 'Ресурсы открываются по порядку объявления, а закрываются в обратном порядке — и **до** того, как выполнится `catch` и `finally`.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\nclass Faulty implements AutoCloseable {\n    @Override\n    public void close() throws Exception {\n        throw new Exception("close failed");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        try (Faulty f = new Faulty()) {\n            throw new IllegalStateException("main failed");\n        } catch (Exception e) {\n            System.out.println(e.getMessage());\n            System.out.println(e.getSuppressed().length);\n        }\n    }\n}\n```',
      options: [
        '`main failed` и `1`',
        '`close failed` и `1`',
        '`main failed` и `0`',
        '`close failed` и `0`',
      ],
      answer: '`main failed` и `1`',
      explain: 'Наружу выходит исключение из тела `try`, а исключение из `close()` не теряется — оно добавляется к нему как подавленное (suppressed). Именно этим try-with-resources лучше ручного `finally`, где исключение из `close()` заменило бы основное.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    static void level3() {\n        System.out.print("3");\n        throw new IllegalStateException();\n    }\n    static void level2() {\n        System.out.print("2");\n        level3();\n        System.out.print("x");\n    }\n    static void level1() {\n        System.out.print("1");\n        try {\n            level2();\n        } finally {\n            System.out.print("F");\n        }\n        System.out.print("y");\n    }\n    public static void main(String[] args) {\n        try {\n            level1();\n        } catch (IllegalStateException e) {\n            System.out.print("C");\n        }\n        System.out.print("E");\n    }\n}\n```',
      answer: ['123FCE'],
      explain: 'Исключение из `level3` всплывает: `level2` прерывается (без `x`), в `level1` выполняется `finally` (`F`), но `y` не печатается — исключение не поймано и идёт дальше. В `main` его ловят (`C`), потом `E`.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    static void recurse() {\n        recurse();\n    }\n    public static void main(String[] args) {\n        try {\n            recurse();\n        } catch (Exception e) {\n            System.out.println("Поймали Exception");\n        }\n        System.out.println("Конец");\n    }\n}\n```',
      options: [
        'Ничего из `println`: программа упадёт со `StackOverflowError`',
        '`Поймали Exception` и `Конец`',
        'Только `Конец`',
        'Ошибка компиляции: бесконечная рекурсия',
      ],
      answer: 'Ничего из `println`: программа упадёт со `StackOverflowError`',
      explain: '`StackOverflowError` — наследник `Error`, а не `Exception`, поэтому `catch (Exception e)` его не ловит. Ошибка уходит из `main`, и программа завершается. Компилятор бесконечную рекурсию не обнаруживает.',
    },
    {
      type: 'choice',
      q: 'Что выведет программа?\n```java\ntry {\n    System.out.print("A");\n    System.exit(0);\n} finally {\n    System.out.print("B");\n}\n```',
      options: ['`A`', '`AB`', '`B`', 'Ошибка компиляции: нет `catch`'],
      answer: '`A`',
      explain: '`System.exit()` немедленно останавливает JVM — это один из редких случаев, когда `finally` не выполняется. А `try` + `finally` без `catch` — вполне допустимая конструкция.',
    },
    {
      type: 'choice',
      q: 'Дан класс `class DataSource { void read() throws IOException {} }`. Какие переопределения в наследниках **скомпилируются**?',
      options: [
        '`void read() throws FileNotFoundException {}`',
        '`void read() {}`',
        '`void read() throws IllegalStateException {}`',
        '`void read() throws Exception {}`',
        '`void read() throws IOException, InterruptedException {}`',
      ],
      answer: [
        '`void read() throws FileNotFoundException {}`',
        '`void read() {}`',
        '`void read() throws IllegalStateException {}`',
      ],
      explain: 'Переопределяющий метод может бросать те же checked-исключения, более узкие (`FileNotFoundException` — потомок `IOException`), не бросать их совсем и бросать любые unchecked. Расширять (`Exception`) или добавлять новые checked (`InterruptedException`) нельзя — код, работающий через ссылку на родителя, к ним не готов.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\ntry {\n    new FileReader("data.txt").close();\n} catch (FileNotFoundException | IOException e) {\n    System.out.println("Ошибка");\n}\n```',
      options: [
        'Нет: типы в multi-catch не должны быть связаны наследованием',
        'Да, и при отсутствии файла выведет `Ошибка`',
        'Нет: multi-catch разрешён только для unchecked-исключений',
        'Нет: в multi-catch можно указать только один checked-тип',
      ],
      answer: 'Нет: типы в multi-catch не должны быть связаны наследованием',
      explain: '`FileNotFoundException` — подкласс `IOException`, указывать его отдельно бессмысленно. javac: «Alternatives in a multi-catch statement cannot be related by subclassing». Достаточно `catch (IOException e)`.',
    },
    {
      type: 'gaps',
      q: 'Допишите собственное checked-исключение и метод, который его выбрасывает',
      code: true,
      caseSensitive: true,
      text: 'class InvalidGradeException extends [Exception] {\n    public InvalidGradeException(String message) {\n        [super](message);\n    }\n}\n\nclass Journal {\n    void setGrade(int grade) [throws] InvalidGradeException {\n        if (grade < 2 || grade > 5) {\n            [throw] [new] InvalidGradeException("Оценка вне диапазона: " + grade);\n        }\n        System.out.println("Оценка " + grade + " сохранена");\n    }\n}',
      explain: 'Наследование от `Exception` делает исключение checked. `super(message)` передаёт сообщение в конструктор родителя — потом его вернёт `getMessage()`. В сигнатуре — `throws` (список типов), в теле — `throw` (конкретный объект).',
    },
    {
      type: 'gaps',
      q: 'Допишите чтение первой строки файла так, чтобы файл закрылся автоматически',
      code: true,
      caseSensitive: true,
      text: '[try] (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {\n    System.out.println(reader.[readLine]());\n} [catch] ([IOException] e) {\n    System.out.println("Не удалось прочитать: " + e.getMessage());\n}',
      explain: 'Это try-with-resources: ресурс объявляется в круглых скобках после `try`, `close()` вызовется сам. `FileNotFoundException` и ошибки чтения — подтипы `IOException`.',
    },
    {
      type: 'choice',
      q: 'Какие из приёмов считаются **плохой практикой**?',
      options: [
        'Пустой блок `catch (Exception e) { }`',
        'Перехват `Throwable` в обычном бизнес-коде',
        'Ловить `IndexOutOfBoundsException` вместо проверки индекса',
        '`return` внутри `finally`',
        'Бросать `IllegalArgumentException` при недопустимом аргументе',
        'Оборачивать исключение с сохранением причины: `new AppException("...", e)`',
      ],
      answer: [
        'Пустой блок `catch (Exception e) { }`',
        'Перехват `Throwable` в обычном бизнес-коде',
        'Ловить `IndexOutOfBoundsException` вместо проверки индекса',
        '`return` внутри `finally`',
      ],
      explain: 'Пустой `catch` прячет ошибки; `Throwable` захватывает и `Error`; исключения не должны заменять обычные проверки; `return` в `finally` теряет исключения. Проверка аргументов с `IllegalArgumentException` и обёртывание с причиной — правильные приёмы.',
    },
    {
      type: 'input',
      q: 'Какой интерфейс должен реализовать класс, чтобы его объект можно было использовать в try-with-resources?',
      answer: ['AutoCloseable', 'java.lang.AutoCloseable', 'Closeable'],
      explain: '`AutoCloseable` с единственным методом `close()`. Его наследник `java.io.Closeable` тоже подходит — его реализуют потоки ввода-вывода.',
    },
    {
      type: 'flashcard',
      front: 'Чем отличаются **checked** и **unchecked** исключения? Приведите по два примера.',
      back: '**Checked** — `Exception` и его потомки, кроме `RuntimeException`. Компилятор требует «поймай или объяви» (`try/catch` или `throws`). Примеры: `IOException`, `InterruptedException`.\n\n**Unchecked** — `RuntimeException`, `Error` и их потомки. Компилятор обработки не требует; обычно это ошибки в коде. Примеры: `NullPointerException`, `IllegalArgumentException`.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Чем `throw` отличается от `throws`?',
      back: '`throw` — **оператор** в теле метода, выбрасывает **один объект**: `throw new IllegalStateException("...")`.\n\n`throws` — часть **объявления** метода, перечисляет **типы**, которые метод может выбросить: `void read() throws IOException, InterruptedException`.',
    },
    {
      type: 'flashcard',
      front: 'Когда выполняется `finally` и какие с ним есть подвохи?',
      back: 'Всегда: после нормального `try`, после `catch`, при непойманном исключении и при `return` в `try`. Не выполнится только при `System.exit()`, крахе JVM или бесконечном цикле.\n\nПодвохи: `return` в `finally` перебивает результат и **глотает** исключение; исключение из `finally` заменяет исходное; изменение примитивной переменной в `finally` не меняет уже вычисленный результат `return`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите метод `static int parseAge(String text)`, который:\n- бросает `IllegalArgumentException("Возраст не указан")`, если `text == null`;\n- превращает строку в число (пробелы по краям игнорируются); если это не число — бросает `IllegalArgumentException` с понятным сообщением, **сохранив исходное исключение как причину**;\n- если возраст вне диапазона 0..150 — бросает `IllegalArgumentException`.\n\nВ `main` вызовите его для `"25"`, `" 42 "`, `"-3"`, `"abc"`, `null` и для каждого выведите `OK: <возраст>` или `Ошибка: <сообщение>`.',
      starter: `public class Main {
    static int parseAge(String text) {
        // ваш код
    }

    public static void main(String[] args) {
        String[] inputs = {"25", " 42 ", "-3", "abc", null};
        // ваш код
    }
}`,
      solution: `public class Main {
    static int parseAge(String text) {
        if (text == null) {
            throw new IllegalArgumentException("Возраст не указан");
        }
        int age;
        try {
            age = Integer.parseInt(text.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Возраст должен быть числом: " + text, e);
        }
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("Возраст вне диапазона 0..150: " + age);
        }
        return age;
    }

    public static void main(String[] args) {
        String[] inputs = {"25", " 42 ", "-3", "abc", null};
        for (String s : inputs) {
            try {
                System.out.println("OK: " + parseAge(s));
            } catch (IllegalArgumentException e) {
                System.out.println("Ошибка: " + e.getMessage());
            }
        }
    }
}
// выведет:
// OK: 25
// OK: 42
// Ошибка: Возраст вне диапазона 0..150: -3
// Ошибка: Возраст должен быть числом: abc
// Ошибка: Возраст не указан`,
      hint: 'Второй аргумент конструктора исключения — причина: `new IllegalArgumentException(message, e)`.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Создайте **checked**-исключение `OutOfStockException` с полями `product` и `missing` (сколько штук не хватает) и сообщением вида `Не хватает товара «Ручка»: 2 шт.`\n\nВ классе `Product` (поля `name`, `stock`) напишите метод `take(int quantity)`: при `quantity <= 0` — `IllegalArgumentException`, при нехватке — `OutOfStockException`, иначе уменьшить остаток.\n\nВ `main`: товар «Ручка» с остатком 10, взять 4, затем 8; поймать исключение и вывести сообщение, а в `finally` вывести `Осталось: <остаток>`.',
      starter: `class OutOfStockException extends Exception {
    // поля, конструктор, геттеры
}

class Product {
    private final String name;
    private int stock;

    public Product(String name, int stock) {
        this.name = name;
        this.stock = stock;
    }

    // take(int quantity)

    public int getStock() { return stock; }
}

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `class OutOfStockException extends Exception {
    private final String product;
    private final int missing;

    public OutOfStockException(String product, int missing) {
        super("Не хватает товара «" + product + "»: " + missing + " шт.");
        this.product = product;
        this.missing = missing;
    }

    public String getProduct() { return product; }
    public int getMissing() { return missing; }
}

class Product {
    private final String name;
    private int stock;

    public Product(String name, int stock) {
        if (stock < 0) {
            throw new IllegalArgumentException("Остаток не может быть отрицательным");
        }
        this.name = name;
        this.stock = stock;
    }

    public void take(int quantity) throws OutOfStockException {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Количество должно быть больше 0: " + quantity);
        }
        if (quantity > stock) {
            throw new OutOfStockException(name, quantity - stock);
        }
        stock -= quantity;
    }

    public int getStock() { return stock; }
}

public class Main {
    public static void main(String[] args) {
        Product pen = new Product("Ручка", 10);
        try {
            pen.take(4);
            pen.take(8);
        } catch (OutOfStockException e) {
            System.out.println(e.getMessage());
        } finally {
            System.out.println("Осталось: " + pen.getStock());
        }
    }
}
// выведет:
// Не хватает товара «Ручка»: 2 шт.
// Осталось: 6`,
      explain: 'Неверное количество — ошибка программиста (unchecked), нехватка товара — ожидаемая бизнес-ситуация, которую вызывающий должен обработать (checked). Обратите внимание: при исключении остаток не изменился — проверка стоит **до** изменения состояния.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Connection implements AutoCloseable`: конструктор принимает `url` и печатает `Подключение к <url>`, метод `send(String message)` печатает `Отправлено: <message>` или бросает `IllegalArgumentException("Пустое сообщение")` для пустой строки, `close()` печатает `Соединение с <url> закрыто`.\n\nВ `main` в try-with-resources отправьте `"привет"`, `""` и `"не дойдёт"`, поймайте исключение и выведите `Ошибка: <сообщение>`. Подумайте заранее, в каком порядке будут строки вывода.',
      starter: `class Connection implements AutoCloseable {
    // ваш код
}

public class Main {
    public static void main(String[] args) {
        // ваш код
    }
}`,
      solution: `class Connection implements AutoCloseable {
    private final String url;

    public Connection(String url) {
        this.url = url;
        System.out.println("Подключение к " + url);
    }

    public void send(String message) {
        if (message.isEmpty()) {
            throw new IllegalArgumentException("Пустое сообщение");
        }
        System.out.println("Отправлено: " + message);
    }

    @Override
    public void close() {
        System.out.println("Соединение с " + url + " закрыто");
    }
}

public class Main {
    public static void main(String[] args) {
        try (Connection c = new Connection("db://shop")) {
            c.send("привет");
            c.send("");
            c.send("не дойдёт");
        } catch (IllegalArgumentException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }
}
// выведет:
// Подключение к db://shop
// Отправлено: привет
// Соединение с db://shop закрыто
// Ошибка: Пустое сообщение`,
      explain: 'Соединение закрывается **до** выполнения `catch` — поэтому строка о закрытии идёт раньше строки «Ошибка». Метод `close()` здесь не объявляет `throws Exception`: переопределяя, мы сузили список исключений, и вызывающему коду не нужно ловить checked-исключение.',
    },
  ],
});
