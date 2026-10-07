// В .js-файлах удобно писать код в обратных кавычках `...` — переносы строк сохраняются.
Trainer.add({
  id: 'python-basics',
  title: 'Python: основы',
  subject: 'Программирование',
  description: 'Ввод-вывод, условия, циклы, функции и списки. Код запускается прямо в браузере.',
  tasks: [
    {
      type: 'code',
      lang: 'python',
      q: 'Программа получает на вход два целых числа, каждое на отдельной строке. Выведите их сумму.',
      starter: `a = int(input())
b = int(input())
`,
      tests: [
        { input: '2\n3', output: '5' },
        { input: '-10\n4', output: '-6' },
        { input: '1000000\n1', output: '1000001', hidden: true },
      ],
      solution: `a = int(input())
b = int(input())
print(a + b)`,
    },
    {
      type: 'code',
      lang: 'python',
      q: 'Дано целое число $n$. Выведите `even`, если оно чётное, и `odd`, если нечётное.',
      tests: [
        { input: '4', output: 'even' },
        { input: '7', output: 'odd' },
        { input: '0', output: 'even' },
        { input: '-3', output: 'odd', hidden: true },
      ],
      solution: `n = int(input())
print('even' if n % 2 == 0 else 'odd')`,
    },
    {
      type: 'code',
      lang: 'python',
      q: 'Дано натуральное число $n$. Выведите числа от 1 до $n$ через пробел.',
      tests: [
        { input: '5', output: '1 2 3 4 5' },
        { input: '1', output: '1' },
      ],
      solution: `n = int(input())
print(*range(1, n + 1))`,
      hint: '`print(*список)` печатает элементы через пробел',
    },
    {
      type: 'code',
      lang: 'python',
      q: 'Напишите функцию `factorial(n)`, которая возвращает $n!$ (произведение чисел от 1 до $n$, $0! = 1$).',
      starter: `def factorial(n):
    `,
      tests: [
        { call: 'factorial(5)', expected: 120 },
        { call: 'factorial(0)', expected: 1 },
        { call: 'factorial(1)', expected: 1 },
        { call: 'factorial(10)', expected: 3628800 },
      ],
      solution: `def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result`,
    },
    {
      type: 'code',
      lang: 'python',
      q: 'Напишите функцию `count_vowels(s)`, которая возвращает количество гласных латинских букв (a, e, i, o, u) в строке без учёта регистра.',
      starter: `def count_vowels(s):
    `,
      tests: [
        { call: 'count_vowels("hello")', expected: 2 },
        { call: 'count_vowels("PYTHON")', expected: 1 },
        { call: 'count_vowels("")', expected: 0 },
        { call: 'count_vowels("Programming Is Fun")', expected: 5, hidden: true },
      ],
      solution: `def count_vowels(s):
    return sum(1 for ch in s.lower() if ch in 'aeiou')`,
    },
    {
      type: 'code',
      lang: 'python',
      q: 'Напишите функцию `only_even(nums)`, которая возвращает новый список только из чётных чисел списка `nums`, сохраняя порядок.',
      starter: `def only_even(nums):
    `,
      tests: [
        { call: 'only_even([1, 2, 3, 4, 5, 6])', expected: [2, 4, 6] },
        { call: 'only_even([1, 3])', expected: [] },
        { call: 'only_even([-2, 0, 7])', expected: [-2, 0] },
      ],
      solution: `def only_even(nums):
    return [x for x in nums if x % 2 == 0]`,
    },
    {
      type: 'choice',
      q: 'Что выведет код?\n```\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))\n```',
      options: ['3', '4', 'Ошибку', '7'],
      answer: '4',
      explain: '`y = x` не копирует список — обе переменные ссылаются на один и тот же объект.',
    },
    {
      type: 'input',
      q: 'Что выведет `print(7 // 2, 7 % 2)`?',
      answer: '3 1',
    },
    {
      type: 'gaps',
      q: 'Заполните пропуски, чтобы код вывел квадраты чисел от 1 до 5',
      text: '[for] i in [range](1, [6]):\n    print(i [**] 2)',
      code: true,
      caseSensitive: true,
    },
    {
      type: 'match',
      q: 'Соедините выражение и его тип',
      pairs: [['`3.0`', 'float'], ['`"3"`', 'str'], ['`[3]`', 'list'], ['`(3,)`', 'tuple'], ['`3 > 2`', 'bool']],
    },
  ],
});
