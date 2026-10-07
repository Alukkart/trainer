Trainer.add({
  id: 'english-past-simple',
  title: 'Past Simple',
  subject: 'Английский',
  description: 'Правильные и неправильные глаголы, отрицания и вопросы в Past Simple.',
  tasks: [
    {
      type: 'gaps',
      q: 'Поставьте глаголы в скобках в Past Simple',
      text: 'Last summer we [went] (go) to the seaside. We [stayed] (stay) in a small hotel and [swam] (swim) every day.\nOne evening my brother [bought] (buy) a huge ice cream and [dropped] (drop) it on the sand.',
      explain: 'go → went, swim → swam, buy → bought — неправильные глаголы. stay → stayed, drop → dropped (согласная удваивается).',
    },
    {
      type: 'gaps',
      q: 'Выберите правильную форму',
      text: 'She [*didn\'t go|didn\'t went|not went] to school yesterday.\n[*Did|Do|Was] you see that film?\nThey [*were|was|did] very tired after the trip.',
      explain: 'После **did / didn\'t** глагол стоит в начальной форме: *didn\'t go*, *did you see*. С they используем **were**.',
    },
    {
      type: 'choice',
      q: 'Какое предложение написано **правильно**?',
      options: ['I didn\'t saw him.', 'I didn\'t see him.', 'I not saw him.', 'I don\'t saw him.'],
      answer: 1,
    },
    {
      type: 'choice',
      q: 'Отметьте все **неправильные** глаголы',
      options: ['write', 'play', 'take', 'watch', 'think', 'open'],
      answer: ['write', 'take', 'think'],
      explain: 'write – wrote – written, take – took – taken, think – thought – thought.',
    },
    { type: 'input', q: 'Вторая форма глагола **to be** для *we / you / they*', answer: 'were' },
    { type: 'input', q: 'Past Simple от **teach**', answer: 'taught' },
    { type: 'input', q: 'Past Simple от **catch**', answer: 'caught' },
    { type: 'input', q: 'Past Simple от **study**', answer: 'studied', hint: 'Согласная + y → ied' },
    {
      type: 'input',
      q: 'Переведите: «Мы не смотрели телевизор вчера».',
      answer: ['We didn\'t watch TV yesterday', 'We did not watch TV yesterday', 'Yesterday we didn\'t watch TV', 'We didn\'t watch television yesterday'],
    },
    {
      type: 'order',
      q: 'Составьте вопрос',
      items: ['Where', 'did', 'you', 'spend', 'your', 'holidays?'],
    },
    {
      type: 'order',
      q: 'Составьте предложение',
      items: ['My', 'parents', 'didn\'t', 'let', 'me', 'go', 'out'],
    },
    {
      type: 'gaps',
      q: 'Вставьте глаголы из банка слов',
      text: 'Columbus [discovered] America in 1492. Shakespeare [wrote] Hamlet. The Titanic [sank] in 1912.',
      bank: true,
      distractors: ['writed', 'sinked'],
    },
  ],
});
