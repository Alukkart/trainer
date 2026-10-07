Trainer.add({
  id: 'english-vocabulary-travel',
  title: 'Слова: путешествия',
  subject: 'Английский',
  description: 'Карточки и сопоставление — лексика по теме Travel.',
  tasks: [
    { type: 'flashcard', front: 'luggage', back: 'багаж' },
    { type: 'flashcard', front: 'departure', back: 'отправление, вылет' },
    { type: 'flashcard', front: 'arrival', back: 'прибытие' },
    { type: 'flashcard', front: 'to book a room', back: 'забронировать номер' },
    { type: 'flashcard', front: 'boarding pass', back: 'посадочный талон' },
    { type: 'flashcard', front: 'customs', back: 'таможня' },
    { type: 'flashcard', front: 'путешествовать налегке', back: 'to travel light', write: true },
    {
      type: 'match',
      q: 'Соедините слово и перевод',
      pairs: [['sightseeing', 'осмотр достопримечательностей'], ['souvenir', 'сувенир'], ['guide', 'экскурсовод'], ['delay', 'задержка'], ['ticket', 'билет']],
    },
    {
      type: 'match',
      q: 'Соедините глагол с подходящим словом',
      pairs: [['catch', 'a train'], ['check in', 'at the hotel'], ['pack', 'a suitcase'], ['go', 'abroad']],
    },
    { type: 'input', q: 'Как по-английски «пересадка» (в аэропорту)?', answer: ['transfer', 'connection', 'layover'] },
  ],
});
