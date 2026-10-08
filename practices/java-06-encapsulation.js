// Java 6. Инкапсуляция. Теория — в поле lesson, задания — в tasks.
Trainer.add({
  id: 'java-06-encapsulation',
  title: 'Java 6. Инкапсуляция',
  subject: 'Java',
  description: 'Зачем скрывать данные: модификаторы доступа, пакеты, геттеры и сеттеры с проверками, неизменяемые классы и защитные копии.',
  lesson: `
## Что такое инкапсуляция

**Инкапсуляция** — принцип ООП, который объединяет данные и методы работы с ними в одном классе и **скрывает внутреннее устройство** объекта от внешнего кода. Снаружи доступен только продуманный набор операций — *публичный интерфейс*.

> 💡 Аналогия: кофемашина. У неё есть кнопки «эспрессо» и «капучино» — это публичный интерфейс. Бойлер, помпа и датчики спрятаны внутри корпуса. Вы не можете случайно подать в бойлер 300 °C, а производитель может заменить помпу на новую модель — для вас ничего не изменится, кнопки те же.

Зачем это нужно:
1. **Защита инвариантов.** *Инвариант* — условие, которое должно быть истинным для объекта всегда: баланс счёта не меняется «сам по себе», возраст не отрицательный, в заказе не бывает −3 товаров. Если поле открыто, любой код может нарушить инвариант одной строкой.
2. **Сокрытие реализации.** Внешний код зависит только от публичных методов. Внутреннее представление можно поменять (хранить деньги в копейках как \`long\` вместо \`double\`), и ничего снаружи не сломается.
3. **Одно место для проверок.** Все изменения проходят через методы — значит, проверки, логирование и пересчёт зависимых данных пишутся один раз.

### Плохо: открытые поля

\`\`\`java
class BankAccount {
    public String owner;
    public double balance;
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        acc.owner = "Аня";
        acc.balance = -1_000_000;   // никто не помешал: инвариант «баланс ≥ 0» нарушен
        acc.owner = null;           // и владелец пропал
        System.out.println(acc.balance); // выведет: -1000000.0
    }
}
\`\`\`

### Хорошо: закрытые поля и осмысленные методы

\`\`\`java
class BankAccount {
    private final String owner;     // владелец не меняется
    private double balance;         // доступ только через методы

    BankAccount(String owner, double initial) {
        if (owner == null || owner.isBlank()) {
            throw new IllegalArgumentException("Нужен владелец");
        }
        if (initial < 0) {
            throw new IllegalArgumentException("Начальный баланс < 0");
        }
        this.owner = owner;
        this.balance = initial;
    }

    public String getOwner() { return owner; }
    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Сумма должна быть > 0");
        }
        balance += amount;
    }

    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > balance) {
            return false;            // операция отклонена, состояние не изменилось
        }
        balance -= amount;
        return true;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Аня", 100);
        acc.deposit(50);
        System.out.println(acc.withdraw(500));  // выведет: false
        System.out.println(acc.withdraw(30));   // выведет: true
        System.out.println(acc.getBalance());   // выведет: 120.0
        // acc.balance = -5;                    // НЕ скомпилируется: balance has private access
        try {
            acc.deposit(-10);
        } catch (IllegalArgumentException e) {
            System.out.println("Ошибка: " + e.getMessage()); // выведет: Ошибка: Сумма должна быть > 0
        }
    }
}
\`\`\`

\`throw new IllegalArgumentException(...)\` — стандартный способ сказать «мне передали недопустимый аргумент»: метод прерывается, объект остаётся в корректном состоянии. Подробно исключения разберём в отдельном уроке.

## Модификаторы доступа

Java позволяет точно указать, кто видит каждый член класса (поле, метод, конструктор):

| Модификатор | Сам класс | Тот же пакет | Наследник в другом пакете | Все остальные |
|---|---|---|---|---|
| \`private\` | ✅ | ❌ | ❌ | ❌ |
| *нет модификатора* (package-private) | ✅ | ✅ | ❌ | ❌ |
| \`protected\` | ✅ | ✅ | ✅ (с оговоркой, см. ниже) | ❌ |
| \`public\` | ✅ | ✅ | ✅ | ✅ |

Модификаторы идут от самого строгого к самому открытому: **private → package-private → protected → public**.

- **\`private\`** — только внутри этого класса. Стандарт для полей.
- **package-private** (модификатор не написан, иногда говорят «default») — видно всем классам **того же пакета**. Удобно для служебных классов, которые не нужны снаружи пакета.
- **\`protected\`** — всё, что даёт package-private, **плюс** наследники из других пакетов.
- **\`public\`** — видно отовсюду.

> ⚠️ Подвох: \`protected\` — это **не** «только для наследников». Он *шире*, чем package-private: любой класс того же пакета, даже не наследник, видит \`protected\`-члены.

> ⚠️ Подвох: \`private\` ограничивает доступ **на уровне класса, а не объекта**. Метод класса \`BankAccount\` может читать \`private\`-поле *другого* объекта \`BankAccount\`: например, \`other.balance\` внутри метода \`transferTo(BankAccount other)\` — это законно.

### Оговорка про protected

Наследник из **другого** пакета может обращаться к \`protected\`-членам предка только «через себя» — через \`this\`, \`super\` или ссылку своего типа (или его потомков). Через ссылку типа *предка* — нельзя:

\`\`\`java
// файл zoo/Animal.java
package zoo;

public class Animal {
    protected int energy = 10;
}
\`\`\`

\`\`\`java
// файл app/Dog.java
package app;

import zoo.Animal;

public class Dog extends Animal {
    void play(Dog otherDog, Animal someAnimal) {
        energy--;               // ОК: своё унаследованное поле (this.energy)
        otherDog.energy--;      // ОК: ссылка типа Dog
        // someAnimal.energy--; // НЕ скомпилируется: energy has protected access in Animal
    }
}
\`\`\`

Логика: Dog — наследник Animal, но это не даёт ему права копаться в чужих животных (вдруг \`someAnimal\` — это кот из совсем другой иерархии).

## Пакеты и import

**Пакет** — это пространство имён для классов, аналог папки. Пакеты группируют связанные классы и разрешают конфликты имён: \`java.util.Date\` и \`java.sql.Date\` — разные классы.

- Объявление \`package shop.orders;\` — **первая** инструкция файла (до неё могут быть только комментарии). Файл должен лежать в папке \`shop/orders/\`.
- Имена пакетов пишутся строчными буквами, часто по обратному домену: \`com.example.shop\`.
- **Полное имя** класса включает пакет: \`java.util.ArrayList\`. Им можно пользоваться без import.
- \`import java.util.ArrayList;\` — импорт одного класса; \`import java.util.*;\` — всех классов пакета \`java.util\`, но **не подпакетов** (\`java.util.function\` не импортируется).
- Пакет \`java.lang\` (\`String\`, \`Math\`, \`System\`, \`Integer\`…) импортируется **автоматически**.
- Класс без объявления \`package\` попадает в *безымянный пакет* — годится только для учебных примеров.

Порядок в файле всегда такой: \`package\` → \`import\` → объявления классов.

\`\`\`java
package shop;

import java.util.ArrayList;
import java.util.List;

public class Order {
    private final List<String> items = new ArrayList<>();

    public void add(String item) {
        items.add(item);
    }

    public int size() {
        return items.size();
    }
}
\`\`\`

> ⚠️ Подвох: если импортировать \`java.util.*\` и \`java.sql.*\` и написать просто \`Date\`, будет ошибка компиляции «reference to Date is ambiguous». Решение — явный импорт нужного класса (\`import java.util.Date;\`) или полное имя.

### Модификаторы для классов верхнего уровня

Класс, объявленный прямо в файле (не внутри другого класса), может быть только:
- **\`public\`** — виден из любых пакетов; такой класс в файле может быть **только один**, и имя файла обязано совпадать с его именем (\`public class Order\` → \`Order.java\`);
- **без модификатора** — виден только внутри своего пакета.

\`private\` и \`protected\` для классов верхнего уровня запрещены (они имеют смысл только для вложенных классов).

## Геттеры и сеттеры

Принято делать поля \`private\`, а доступ давать через методы:
- **геттер** \`getX()\` — вернуть значение (для \`boolean\` — \`isX()\`: \`isActive()\`);
- **сеттер** \`setX(значение)\` — изменить значение **с проверкой**.

\`\`\`java
class Student {
    private String name;
    private int age;

    Student(String name, int age) {
        setName(name);   // те же проверки, что и в сеттерах
        setAge(age);
    }

    public String getName() { return name; }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Пустое имя");
        }
        this.name = name.trim();
    }

    public int getAge() { return age; }

    public void setAge(int age) {
        if (age < 16 || age > 100) {
            throw new IllegalArgumentException("Недопустимый возраст: " + age);
        }
        this.age = age;
    }
}
\`\`\`

> ⚠️ Подвох: проверку нужно делать и в **конструкторе**, иначе объект можно создать сразу некорректным (\`new Student("", -5)\`). Простой способ — вызывать из конструктора те же методы-проверки.

### Анемичные сеттеры — плохо

Механически сгенерировать геттер и сеттер для каждого поля — не инкапсуляция, а её имитация. Метод \`setBalance(double b)\` без проверок ничем не лучше публичного поля: кто угодно может установить любой баланс. Лучше спросить себя: *какие операции имеют смысл для этого объекта?*

| Плохо | Хорошо |
|---|---|
| \`setBalance(getBalance() - 100)\` | \`withdraw(100)\` |
| \`setStatus("PAID")\` | \`pay()\` — с проверкой, что заказ ещё не оплачен |
| \`getItems().add(item)\` | \`addItem(item)\` — с проверкой количества |

Принцип **«Tell, don't ask»** («говори, а не спрашивай»): вместо того чтобы вытащить данные из объекта, принять решение снаружи и записать результат обратно, *попросите объект* выполнить действие — он сам знает свои правила. Не у каждого поля должен быть сеттер; у многих не должно быть даже геттера.

## Неизменяемые (immutable) классы

**Неизменяемый объект** после создания никогда не меняет своё состояние. Пример из стандартной библиотеки — \`String\`: метод \`toUpperCase()\` не меняет строку, а возвращает новую.

Почему это удобно:
- объект можно безопасно передавать куда угодно — его никто не испортит;
- не нужно думать о синхронизации в многопоточных программах;
- такие объекты надёжно работают как ключи в \`HashMap\` и элементы \`HashSet\`.

**Рецепт неизменяемого класса:**
1. Все поля \`private final\`.
2. Нет сеттеров и других методов, меняющих состояние. «Изменение» = возврат **нового** объекта.
3. Класс \`final\` (чтобы наследник не добавил изменяемость).
4. **Защитные копии** (defensive copies) изменяемых полей: копировать при получении в конструкторе и при выдаче наружу из геттера.

\`\`\`java
final class Money {
    private final long rubles;

    Money(long rubles) {
        this.rubles = rubles;
    }

    Money plus(Money other) {
        return new Money(this.rubles + other.rubles);  // новый объект, старый не тронут
    }

    long getRubles() { return rubles; }
}

public class Main {
    public static void main(String[] args) {
        Money a = new Money(100);
        Money b = a.plus(new Money(50));
        System.out.println(a.getRubles() + " " + b.getRubles()); // выведет: 100 150
    }
}
\`\`\`

### Защитные копии

\`final\` у поля запрещает менять **ссылку**, но не содержимое объекта, на который она указывает. Если поле — массив или список, его можно изменить снаружи:

\`\`\`java
import java.util.Arrays;

final class LeakyStudent {                // Плохо
    private final int[] grades;

    LeakyStudent(int[] grades) {
        this.grades = grades;             // сохранили ЧУЖУЮ ссылку
    }

    int[] getGrades() {
        return grades;                    // отдали СВОЮ ссылку
    }
}

final class SafeStudent {                 // Хорошо
    private final int[] grades;

    SafeStudent(int[] grades) {
        this.grades = Arrays.copyOf(grades, grades.length);  // копия на входе
    }

    int[] getGrades() {
        return Arrays.copyOf(grades, grades.length);         // копия на выходе
    }
}

public class Main {
    public static void main(String[] args) {
        int[] marks = {5, 4, 5};
        LeakyStudent leaky = new LeakyStudent(marks);
        SafeStudent safe = new SafeStudent(marks);

        marks[0] = 2;                     // меняем исходный массив
        leaky.getGrades()[1] = 2;         // и массив, полученный из геттера
        safe.getGrades()[1] = 2;

        System.out.println(Arrays.toString(leaky.getGrades())); // выведет: [2, 2, 5]
        System.out.println(Arrays.toString(safe.getGrades()));  // выведет: [5, 4, 5]
    }
}
\`\`\`

Для списков удобны \`List.copyOf(list)\` (Java 10+) — создаёт неизменяемую копию — и \`Collections.unmodifiableList(list)\` — «обёртка только для чтения».

> ⚠️ Подвох: защитная копия нужна **в обе стороны**. Копия только в конструкторе не спасёт, если геттер отдаёт внутренний массив, и наоборот.

## Типичные ошибки

- Публичные поля → любой код нарушает инварианты.
- Сеттеры без проверок для всех полей «по привычке».
- Проверки в сеттере есть, а в конструкторе — нет.
- Геттер возвращает внутренний изменяемый массив/список.
- Думать, что \`protected\` — «только для наследников» (а он ещё и для всего пакета).
- Думать, что \`private\` закрывает поле от других объектов того же класса.
- Два \`public\` класса в одном файле или имя файла не совпадает с \`public\` классом.

## Шпаргалка

| Что | Как |
|---|---|
| Поля | \`private\` (почти всегда) |
| Доступ к данным | геттеры; сеттеры — только где изменение осмысленно, с проверками |
| Изменение состояния | методы-операции с проверкой инвариантов (\`deposit\`, \`withdraw\`) |
| Неизменяемый класс | \`final\` класс, \`private final\` поля, нет сеттеров, защитные копии |
| \`private\` | только этот класс (но любой его объект) |
| package-private | весь пакет |
| \`protected\` | весь пакет + наследники (из чужого пакета — через ссылку своего типа) |
| \`public\` | все |
| Класс верхнего уровня | \`public\` (один на файл, имя = имя файла) или без модификатора |
| \`import p.*\` | все классы пакета \`p\`, без подпакетов; \`java.lang\` — автоматически |
`,
  tasks: [
    {
      type: 'choice',
      q: 'Какое определение инкапсуляции самое точное?',
      options: [
        'Объединение данных и методов в классе с сокрытием внутреннего устройства: снаружи доступен только продуманный публичный интерфейс',
        'Создание нового класса на основе существующего',
        'Возможность одного и того же вызова работать по-разному для разных объектов',
        'Обязательное наличие геттера и сеттера у каждого поля',
      ],
      answer: 'Объединение данных и методов в классе с сокрытием внутреннего устройства: снаружи доступен только продуманный публичный интерфейс',
      explain: 'Второй вариант — наследование, третий — полиморфизм. А геттеры/сеттеры «для всех полей» — это как раз имитация инкапсуляции, а не её суть.',
    },
    {
      type: 'order',
      q: 'Расставьте модификаторы доступа от самого **строгого** к самому **открытому**',
      items: ['`private`', 'package-private (без модификатора)', '`protected`', '`public`'],
      join: ' → ',
      explain: 'Каждый следующий уровень включает всё, что разрешал предыдущий: protected = весь пакет + наследники в других пакетах.',
    },
    {
      type: 'match',
      q: 'Соедините модификатор и то, кому доступен член класса',
      pairs: [
        ['`private`', 'Только коду внутри этого же класса'],
        ['без модификатора', 'Всем классам того же пакета'],
        ['`protected`', 'Всем классам пакета и наследникам из других пакетов'],
        ['`public`', 'Любому классу из любого пакета'],
      ],
    },
    {
      type: 'choice',
      q: 'Что произойдёт?\n```java\nclass Account {\n    private double balance = 100;\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Account a = new Account();\n        System.out.println(a.balance);\n    }\n}\n```',
      options: [
        'Ошибка компиляции: `balance has private access in Account`',
        'Выведет `100.0`: классы в одном файле видят private-поля друг друга',
        'Выведет `0.0`',
        'Исключение во время выполнения',
      ],
      answer: 'Ошибка компиляции: `balance has private access in Account`',
      explain: '`private` — доступ только внутри класса `Account`. То, что классы лежат в одном файле и одном пакете, ничего не меняет.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (два числа через пробел)\n```java\nclass Account {\n    private double balance;\n\n    Account(double balance) {\n        this.balance = balance;\n    }\n\n    void transferTo(Account other, double amount) {\n        this.balance -= amount;\n        other.balance += amount;\n    }\n\n    double getBalance() {\n        return balance;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Account a = new Account(100);\n        Account b = new Account(50);\n        a.transferTo(b, 30);\n        System.out.println(a.getBalance() + " " + b.getBalance());\n    }\n}\n```',
      answer: ['70.0 80.0'],
      explain: 'Код компилируется: `private` ограничивает доступ на уровне **класса**, а не объекта. Метод класса `Account` может обращаться к `other.balance` другого объекта `Account`.',
    },
    {
      type: 'choice',
      q: 'Оба класса лежат в одном пакете `shop`. Скомпилируется ли код?\n```java\npackage shop;\n\nclass Product {\n    protected double price = 10;\n}\n\nclass Report {                       // НЕ наследник Product\n    void print(Product p) {\n        System.out.println(p.price);\n    }\n}\n```',
      options: [
        'Да: `protected` открывает доступ всему пакету',
        'Нет: `protected` доступен только наследникам',
        'Нет: `Report` должен быть объявлен как `public`',
        'Да, но только если `Product` объявлен `public`',
      ],
      answer: 'Да: `protected` открывает доступ всему пакету',
      explain: 'Частое заблуждение: «protected — только для наследников». На самом деле protected = package-private + наследники из других пакетов.',
    },
    {
      type: 'choice',
      q: 'Классы лежат в **разных** пакетах. Какие строки **не скомпилируются**?\n```java\n// файл shapes/Shape.java\npackage shapes;\n\npublic class Shape {\n    protected String color = "red";\n}\n```\n```java\n// файл app/Circle.java\npackage app;\n\nimport shapes.Shape;\n\npublic class Circle extends Shape {\n    void test(Circle c, Shape s) {\n        System.out.println(color);            // 1\n        System.out.println(this.color);       // 2\n        System.out.println(c.color);          // 3\n        System.out.println(s.color);          // 4\n        System.out.println(new Shape().color);// 5\n    }\n}\n```',
      options: ['1', '2', '3', '4', '5'],
      answer: ['4', '5'],
      hint: 'Наследник из другого пакета видит protected-члены только «через себя».',
      explain: 'Из другого пакета наследник может обращаться к protected-члену предка только через ссылку своего типа (или его потомков): `color`, `this.color`, `c.color` (c — Circle). Через ссылку типа `Shape` (строки 4 и 5) — ошибка «color has protected access in Shape».',
    },
    {
      type: 'choice',
      q: 'Классы в разных пакетах. Что произойдёт при компиляции `Savings`?\n```java\n// файл base/Account.java\npackage base;\n\npublic class Account {\n    void audit() { }\n    protected void log() { }\n}\n```\n```java\n// файл ext/Savings.java\npackage ext;\n\nimport base.Account;\n\npublic class Savings extends Account {\n    void run() {\n        log();\n        audit();\n    }\n}\n```',
      options: [
        'Ошибка в строке `audit();`: метод package-private и не виден из другого пакета даже наследнику',
        'Ошибка в строке `log();`: protected-методы нельзя вызывать без `super`',
        'Ошибки в обеих строках',
        'Всё скомпилируется: наследник видит все методы предка, кроме private',
      ],
      answer: 'Ошибка в строке `audit();`: метод package-private и не виден из другого пакета даже наследнику',
      explain: 'Метод без модификатора доступен только в пакете `base` и наследником из другого пакета даже не наследуется — компилятор скажет «cannot find symbol». Наследование не расширяет package-private доступ. А `log()` — protected, наследник вызывает его у себя (`this.log()`) — это разрешено.',
    },
    {
      type: 'input',
      q: 'Что выведет программа? (через пробел)\n```java\nclass Wallet {\n    private int money;\n\n    Wallet(int money) {\n        this.money = Math.max(0, money);\n    }\n\n    boolean spend(int amount) {\n        if (amount <= 0 || amount > money) {\n            return false;\n        }\n        money -= amount;\n        return true;\n    }\n\n    void earn(int amount) {\n        if (amount > 0) {\n            money += amount;\n        }\n    }\n\n    int getMoney() {\n        return money;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Wallet w = new Wallet(-50);\n        w.earn(100);\n        w.earn(-30);\n        boolean a = w.spend(150);\n        boolean b = w.spend(60);\n        System.out.println(a + " " + b + " " + w.getMoney());\n    }\n}\n```',
      answer: ['false true 40'],
      explain: 'Конструктор не даёт начать с отрицательной суммы: 0. Затем +100, а `earn(-30)` игнорируется → 100. Списать 150 нельзя (false), 60 — можно (true), остаётся 40. Инвариант «денег ≥ 0» сохраняется всегда.',
    },
    {
      type: 'gaps',
      q: 'Допишите класс так, чтобы температура была скрыта и могла устанавливаться только в диапазоне 10..30',
      code: true,
      caseSensitive: true,
      text: 'class Thermostat {\n    [private] int temperature = 20;\n\n    public int [getTemperature]() {\n        [return] temperature;\n    }\n\n    public void setTemperature(int temperature) {\n        if (temperature < 10 || temperature > 30) {\n            throw new [IllegalArgumentException]("Недопустимо: " + temperature);\n        }\n        [this].temperature = temperature;\n    }\n}',
      explain: 'Поле `private`, геттер по соглашению `getИмяПоля`, сеттер проверяет значение и выбрасывает `IllegalArgumentException` для недопустимого аргумента. `this.temperature` — поле, без `this` было бы присваивание параметру.',
    },
    {
      type: 'choice',
      q: 'В классе `BankAccount` поле `balance` сделали `private`, но добавили метод `public void setBalance(double b) { balance = b; }`. Что с этим не так?',
      options: [
        'Это имитация инкапсуляции: любой код по-прежнему может поставить любой баланс, лучше дать операции `deposit`/`withdraw` с проверками',
        'Всё отлично: поле ведь private',
        'Сеттер не скомпилируется: он должен возвращать `boolean`',
        'Сеттеры нельзя делать public',
      ],
      answer: 'Это имитация инкапсуляции: любой код по-прежнему может поставить любой баланс, лучше дать операции `deposit`/`withdraw` с проверками',
      explain: 'Сеттер без проверок — то же публичное поле, только длиннее. Инкапсуляция — это не «private + геттер + сеттер», а контроль над тем, как меняется состояние (принцип «Tell, don\'t ask»).',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nimport java.util.ArrayList;\nimport java.util.List;\n\nclass Playlist {\n    private final List<String> songs = new ArrayList<>();\n\n    void add(String song) {\n        if (songs.size() < 3) {      // не больше трёх песен\n            songs.add(song);\n        }\n    }\n\n    List<String> getSongs() {\n        return songs;\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Playlist p = new Playlist();\n        p.add("A");\n        p.add("B");\n        p.add("C");\n        p.add("D");\n        p.getSongs().add("E");\n        System.out.println(p.getSongs().size());\n    }\n}\n```',
      answer: ['4'],
      explain: '`add("D")` отклонён проверкой, но геттер отдаёт наружу **сам** внутренний список — и через него ограничение обходится: `getSongs().add("E")`. `final` не помогает: он запрещает менять ссылку, а не список. Исправление: `return List.copyOf(songs);` или `Collections.unmodifiableList(songs)`.',
    },
    {
      type: 'choice',
      q: 'Что нужно сделать, чтобы класс `Passport` с полями `String number` и `int[] stamps` стал **неизменяемым**? Отметьте всё необходимое.',
      options: [
        'Сделать поля `private final`',
        'Убрать сеттеры и другие методы, меняющие поля',
        'В конструкторе и геттере копировать массив `stamps`',
        'Объявить класс `final`',
        'Сделать все методы `static`',
        'Сделать поля `public final`, чтобы геттеры были не нужны',
      ],
      answer: ['Сделать поля `private final`', 'Убрать сеттеры и другие методы, меняющие поля', 'В конструкторе и геттере копировать массив `stamps`', 'Объявить класс `final`'],
      explain: 'Массив — изменяемый объект, поэтому нужны защитные копии в обе стороны. `public final int[]` не спасает: ссылку не поменять, а элементы массива — легко. `final` у класса не даёт наследнику добавить изменяемость.',
    },
    {
      type: 'order',
      q: 'Расставьте строки файла `Cart.java` в правильном порядке',
      items: [
        'package shop;',
        'import java.util.List;',
        'public class Cart {',
        '    private List<String> items;',
        '}',
      ],
      join: '\n',
      explain: 'Сначала объявление пакета (оно должно быть первой инструкцией файла), затем импорты, затем классы.',
    },
    {
      type: 'choice',
      q: 'Скомпилируется ли код?\n```java\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> list = new ArrayList<>();\n        Function<Integer, Integer> twice = x -> x * 2;\n        list.add(twice.apply(21));\n        System.out.println(list);\n    }\n}\n```',
      options: [
        'Нет: `Function` лежит в подпакете `java.util.function`, а `import java.util.*` подпакеты не импортирует',
        'Да, выведет `[42]`',
        'Нет: нельзя импортировать через `*`',
        'Нет: `List` нужно импортировать отдельно',
      ],
      answer: 'Нет: `Function` лежит в подпакете `java.util.function`, а `import java.util.*` подпакеты не импортирует',
      explain: 'Пакеты в Java не вложены «по-настоящему»: `java.util.function` — отдельный пакет. Нужно добавить `import java.util.function.Function;`.',
    },
    {
      type: 'choice',
      q: 'Какие классы можно использовать **без** `import`?',
      options: ['`String`', '`Math`', '`System`', '`Integer`', '`Scanner`', '`ArrayList`'],
      answer: ['`String`', '`Math`', '`System`', '`Integer`'],
      explain: 'Пакет `java.lang` импортируется автоматически. `Scanner` и `ArrayList` лежат в `java.util` — их нужно импортировать (или писать полное имя `java.util.Scanner`).',
    },
    {
      type: 'input',
      q: 'Как называется условие, которое должно быть истинным для объекта **всегда**, пока он существует (например, «баланс счёта не меньше нуля»)?',
      answer: ['инвариант', 'инвариант класса', 'invariant'],
      explain: 'Главная задача инкапсуляции — не дать внешнему коду нарушить инварианты объекта.',
    },
    {
      type: 'choice',
      q: 'Что произойдёт при компиляции?\n```java\nimport java.util.*;\nimport java.sql.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Date d = null;\n        System.out.println(d);\n    }\n}\n```',
      options: [
        'Ошибка: `reference to Date is ambiguous` — класс `Date` есть в обоих пакетах',
        'Используется `java.util.Date`, потому что он импортирован первым',
        'Используется `java.sql.Date`, потому что он импортирован последним',
        'Выведет `null`',
      ],
      answer: 'Ошибка: `reference to Date is ambiguous` — класс `Date` есть в обоих пакетах',
      explain: 'Порядок импортов роли не играет. Нужно явно импортировать один класс (`import java.util.Date;` — явный импорт главнее импорта через `*`) или написать полное имя.',
    },
    {
      type: 'choice',
      q: 'Файл называется `Main.java`. Скомпилируется ли он?\n```java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Helper().help());\n    }\n}\n\npublic class Helper {\n    String help() {\n        return "OK";\n    }\n}\n```',
      options: [
        'Нет: public-класс `Helper` должен лежать в файле `Helper.java`',
        'Да, выведет `OK`',
        'Нет: в одном файле может быть только один класс',
        'Да, но `Helper` будет виден только внутри пакета',
      ],
      answer: 'Нет: public-класс `Helper` должен лежать в файле `Helper.java`',
      explain: 'В файле может быть сколько угодно классов верхнего уровня, но `public` — не больше одного, и имя файла должно совпадать с его именем. Если убрать `public` у `Helper`, код скомпилируется.',
    },
    {
      type: 'choice',
      q: 'Какие модификаторы доступа допустимы для класса **верхнего уровня** (не вложенного)?',
      options: ['`public`', 'без модификатора', '`private`', '`protected`'],
      answer: ['`public`', 'без модификатора'],
      explain: '`private` и `protected` имеют смысл только для членов класса (в том числе вложенных классов). Класс верхнего уровня либо виден всем (`public`), либо только своему пакету.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\nfinal class Point {\n    private final int x;\n    private final int y;\n\n    Point(int x, int y) {\n        this.x = x;\n        this.y = y;\n    }\n\n    Point moveBy(int dx, int dy) {\n        return new Point(x + dx, y + dy);\n    }\n\n    @Override\n    public String toString() {\n        return "(" + x + ", " + y + ")";\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Point p = new Point(1, 1);\n        p.moveBy(5, 5);\n        Point q = p.moveBy(1, 0);\n        System.out.println(p + " " + q);\n    }\n}\n```',
      answer: ['(1, 1) (2, 1)'],
      explain: '`Point` неизменяемый: `moveBy` не трогает `p`, а возвращает новый объект. Результат первого вызова никуда не сохранён и потерян. Ровно так же ведут себя методы `String`.',
    },
    {
      type: 'input',
      q: 'Что выведет программа?\n```java\npublic class Main {\n    public static void main(String[] args) {\n        String s = "java";\n        s.toUpperCase();\n        s.concat("17");\n        String t = s.replace(\'a\', \'o\');\n        System.out.println(s + " " + t);\n    }\n}\n```',
      answer: ['java jovo'],
      explain: '`String` — неизменяемый класс. `toUpperCase`, `concat`, `replace` возвращают **новые** строки; если результат не сохранить, он теряется, а `s` остаётся `"java"`.',
    },
    {
      type: 'flashcard',
      front: 'Инкапсуляция: что это и какие две задачи она решает?',
      back: 'Объединение данных и методов в классе с **сокрытием внутреннего устройства**.\n1) **Защита инвариантов** — состояние меняется только через методы с проверками.\n2) **Сокрытие реализации** — внутреннее представление можно менять, не ломая внешний код.',
    },
    {
      type: 'flashcard',
      front: 'Рецепт неизменяемого (immutable) класса',
      back: '1) Все поля `private final`.\n2) Нет сеттеров; «изменение» возвращает новый объект.\n3) Класс `final`.\n4) Защитные копии изменяемых полей (массивы, списки) — в конструкторе **и** в геттерах.',
      write: true,
    },
    {
      type: 'flashcard',
      front: 'Кто видит `protected`-член класса?',
      back: 'Сам класс, **все классы того же пакета** (даже не наследники) и наследники из других пакетов — причём наследник из чужого пакета обращается к нему только через `this`/`super` или ссылку своего типа, а не через ссылку типа предка.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `BankAccount` с инкапсуляцией:\n- `private` поля `owner` (неизменяемое) и `balance`;\n- конструктор проверяет, что владелец не пустой и начальный баланс ≥ 0 (иначе `IllegalArgumentException`);\n- `deposit(double)` — только положительные суммы (иначе исключение);\n- `boolean withdraw(double)` — возвращает `false`, если денег не хватает или сумма ≤ 0;\n- `boolean transferTo(BankAccount other, double amount)` — перевод, использующий `withdraw` и `deposit`;\n- геттеры, **без** `setBalance`.',
      starter: `class BankAccount {

}

public class Main {
    public static void main(String[] args) {
        BankAccount a = new BankAccount("Аня", 100);
        BankAccount b = new BankAccount("Борис", 0);
        System.out.println(a.transferTo(b, 30));   // true
        System.out.println(a.transferTo(b, 500));  // false
        System.out.println(a.getBalance() + " " + b.getBalance()); // 70.0 30.0
    }
}`,
      solution: `class BankAccount {
    private final String owner;
    private double balance;

    BankAccount(String owner, double initial) {
        if (owner == null || owner.isBlank()) {
            throw new IllegalArgumentException("Нужен владелец");
        }
        if (initial < 0) {
            throw new IllegalArgumentException("Отрицательный баланс");
        }
        this.owner = owner;
        this.balance = initial;
    }

    public String getOwner() {
        return owner;
    }

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Сумма должна быть > 0");
        }
        balance += amount;
    }

    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > balance) {
            return false;
        }
        balance -= amount;
        return true;
    }

    public boolean transferTo(BankAccount other, double amount) {
        if (other == null || other == this) {
            return false;
        }
        if (!withdraw(amount)) {
            return false;
        }
        other.deposit(amount);
        return true;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount a = new BankAccount("Аня", 100);
        BankAccount b = new BankAccount("Борис", 0);
        System.out.println(a.transferTo(b, 30));   // true
        System.out.println(a.transferTo(b, 500));  // false
        System.out.println(a.getBalance() + " " + b.getBalance()); // 70.0 30.0
    }
}`,
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите **неизменяемый** класс `Group` — учебная группа с названием и списком студентов (`List<String>`).\n- Внешний код не должен иметь возможности изменить группу ни через исходный список, переданный в конструктор, ни через список, полученный из геттера.\n- Метод `Group withStudent(String name)` возвращает **новую** группу с добавленным студентом.\n\nПокажите в `main`, что исходная группа не меняется.',
      starter: `import java.util.ArrayList;
import java.util.List;

final class Group {

}

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Аня", "Борис"));
        Group g = new Group("ИВТ-11", names);
        names.add("Хакер");                 // не должно повлиять на g
        Group g2 = g.withStudent("Вера");
        System.out.println(g.getStudents());  // [Аня, Борис]
        System.out.println(g2.getStudents()); // [Аня, Борис, Вера]
    }
}`,
      solution: `import java.util.ArrayList;
import java.util.List;

final class Group {
    private final String title;
    private final List<String> students;

    Group(String title, List<String> students) {
        this.title = title;
        this.students = List.copyOf(students);   // защитная неизменяемая копия
    }

    public String getTitle() {
        return title;
    }

    public List<String> getStudents() {
        return students;   // List.copyOf уже неизменяемый — отдавать безопасно
    }

    public Group withStudent(String name) {
        List<String> copy = new ArrayList<>(students);
        copy.add(name);
        return new Group(title, copy);
    }
}

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Аня", "Борис"));
        Group g = new Group("ИВТ-11", names);
        names.add("Хакер");                 // не влияет на g
        Group g2 = g.withStudent("Вера");
        System.out.println(g.getStudents());  // [Аня, Борис]
        System.out.println(g2.getStudents()); // [Аня, Борис, Вера]
        try {
            g.getStudents().add("Взлом");
        } catch (UnsupportedOperationException e) {
            System.out.println("Изменить нельзя");
        }
    }
}`,
      explain: '`List.copyOf` делает копию, которую нельзя изменить (`add` бросит `UnsupportedOperationException`), поэтому её можно отдавать из геттера без повторного копирования. С обычным `ArrayList` пришлось бы копировать и в геттере.',
    },
    {
      type: 'code',
      lang: 'java',
      q: 'Напишите класс `Order` (заказ в магазине) в стиле «Tell, don\'t ask» — без сеттеров для статуса:\n- `addItem(String item)` — можно только пока заказ не оплачен;\n- `pay()` — нельзя оплатить пустой или уже оплаченный заказ;\n- `ship()` — отправить можно только оплаченный и ещё не отправленный заказ;\n- при нарушении правил методы бросают `IllegalStateException`;\n- `getStatus()` возвращает `"новый"`, `"оплачен"` или `"отправлен"`.',
      solution: `import java.util.ArrayList;
import java.util.List;

class Order {
    private final List<String> items = new ArrayList<>();
    private boolean paid;
    private boolean shipped;

    public void addItem(String item) {
        if (paid) {
            throw new IllegalStateException("Заказ уже оплачен");
        }
        items.add(item);
    }

    public void pay() {
        if (items.isEmpty()) {
            throw new IllegalStateException("Пустой заказ");
        }
        if (paid) {
            throw new IllegalStateException("Уже оплачен");
        }
        paid = true;
    }

    public void ship() {
        if (!paid || shipped) {
            throw new IllegalStateException("Нельзя отправить");
        }
        shipped = true;
    }

    public String getStatus() {
        if (shipped) return "отправлен";
        if (paid) return "оплачен";
        return "новый";
    }

    public List<String> getItems() {
        return List.copyOf(items);
    }
}

public class Main {
    public static void main(String[] args) {
        Order o = new Order();
        o.addItem("Ноутбук");
        System.out.println(o.getStatus()); // новый
        o.pay();
        System.out.println(o.getStatus()); // оплачен
        try {
            o.addItem("Мышка");
        } catch (IllegalStateException e) {
            System.out.println(e.getMessage()); // Заказ уже оплачен
        }
        o.ship();
        System.out.println(o.getStatus()); // отправлен
    }
}`,
    },
  ],
});
