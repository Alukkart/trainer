Trainer.add({
  id: 'javascript-basics',
  title: 'JavaScript: функции и массивы',
  subject: 'Программирование',
  description: 'Функции, массивы, строки. Плюс пример задачи на C++ с самопроверкой.',
  tasks: [
    {
      type: 'code',
      lang: 'javascript',
      q: 'Напишите функцию `max(arr)`, которая возвращает наибольший элемент массива чисел **без** использования `Math.max`.',
      starter: `function max(arr) {

}`,
      tests: [
        { call: 'max([1, 5, 3])', expected: 5 },
        { call: 'max([-7, -2, -9])', expected: -2 },
        { call: 'max([42])', expected: 42 },
      ],
      solution: `function max(arr) {
  let best = arr[0];
  for (const x of arr) if (x > best) best = x;
  return best;
}`,
    },
    {
      type: 'code',
      lang: 'javascript',
      q: 'Напишите функцию `isPalindrome(s)`: вернуть `true`, если строка читается одинаково слева направо и справа налево (регистр не учитывать).',
      starter: `function isPalindrome(s) {

}`,
      tests: [
        { call: 'isPalindrome("Level")', expected: true },
        { call: 'isPalindrome("hello")', expected: false },
        { call: 'isPalindrome("")', expected: true },
      ],
      solution: `function isPalindrome(s) {
  s = s.toLowerCase();
  return s === [...s].reverse().join('');
}`,
    },
    {
      type: 'code',
      lang: 'javascript',
      q: 'Программа получает строку из чисел через пробел (`input()` возвращает строку). Выведите их сумму через `console.log`.',
      starter: `const line = input();
`,
      tests: [
        { input: '1 2 3', output: '6' },
        { input: '10 -5', output: '5' },
      ],
      solution: `const line = input();
console.log(line.split(' ').map(Number).reduce((a, b) => a + b, 0));`,
    },
    {
      type: 'choice',
      q: 'Чему равно `typeof null`?',
      options: ['"null"', '"object"', '"undefined"', '"number"'],
      answer: 1,
      explain: 'Это историческая ошибка языка, которую сохранили ради совместимости.',
    },
    {
      type: 'order',
      q: 'Расставьте строки так, чтобы функция считала сумму элементов массива',
      items: ['function sum(arr) {', '  let s = 0;', '  for (const x of arr) s += x;', '  return s;', '}'],
      join: '\n',
    },
    {
      type: 'code',
      lang: 'cpp',
      q: 'Напишите на C++ программу, которая читает два целых числа и выводит большее из них.',
      starter: `#include <iostream>
using namespace std;

int main() {

}`,
      solution: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << (a > b ? a : b) << endl;
}`,
    },
  ],
});
