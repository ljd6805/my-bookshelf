"""Verify the persona source for the book-making team (data/agent-team.json)."""
import copy
import json
import unittest
from pathlib import Path
from scripts.team_renderer import check_team, render_team_section

DATA = json.loads((Path(__file__).resolve().parents[1] / 'data/agent-team.json').read_text())


class TeamPersonaTests(unittest.TestCase):
    def test_every_persona_is_complete(self):
        self.assertEqual(check_team(DATA), 1 + sum(len(t['members']) for t in DATA['teams']))

    def test_missing_field_is_rejected(self):
        broken = copy.deepcopy(DATA)
        del broken['teams'][0]['members'][1]['blind_spot']
        with self.assertRaises(ValueError):
            check_team(broken)

    def test_team_must_list_lead_first(self):
        broken = copy.deepcopy(DATA)
        broken['teams'][0]['members'].reverse()
        with self.assertRaises(ValueError):
            check_team(broken)

    def test_shelf_section_links_every_team(self):
        section = render_team_section(DATA)
        for team in DATA['teams']:
            self.assertIn(f'team.html#{team["id"]}', section)


if __name__ == '__main__':
    unittest.main()
