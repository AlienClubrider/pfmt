import unittest
from spoken import spoken


class SpokenTest(unittest.TestCase):
    def test_money_and_percent(self):
        self.assertEqual(spoken('$18, minus a 15% store cut'), '18 dollars, minus a 15 percent store cut')
        self.assertEqual(spoken('$X a day, $1,500 total'), 'X dollars a day, 1,500 dollars total')

    def test_code_shapes(self):
        self.assertEqual(spoken('A CompletableFuture<Void> here'), 'A Completable Future of Void here')
        self.assertEqual(spoken('call supplyAsync(() -> ...) now'), 'call supply Async(a lambda) now')
        self.assertEqual(spoken('runAsync, .submit(, parallelStream'), 'run Async, submit, parallel Stream')
        self.assertEqual(spoken('Ad spend ÷ new customers'), 'Ad spend divided by new customers')

    def test_leaves_plain_text_alone(self):
        for s in ['For [who] who', 'an iPhone app', 'LTV and CAC', '0.12 + 0.2 = 0.32', 'Java 21+']:
            self.assertEqual(spoken(s), s.replace('[who]', 'who'))


if __name__ == '__main__':
    unittest.main()
