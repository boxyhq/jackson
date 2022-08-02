import Chance from 'chance';
import * as Retraced from 'retraced';
const chance = new Chance();

const actions = [
  'license.update',
  'spline.reticulate',
  'user.login',
  'release.promote',
  'wozniak.bore',
  'page.load',
];

const ips = ['192.168.1.1', '200.168.1.10', '12.18.12.13', '92.68.51.21'];

export default async function handler(req, res) {
  const actor_id = chance.guid();
  const actor_name = chance.name();

  //   use a random action
  const randomAction = actions[chance.integer({ min: 0, max: actions.length - 1 })];

  //   use random ips
  const randomIPs = ips[chance.integer({ min: 0, max: ips.length - 1 })];

  const retraced = new Retraced.Client({
    apiKey: req.query.token || 'dev',
    projectId: req.query.project || 'dev',
    endpoint: process.env.RETRACED_HOST,
  });

  const team_id = req.query.group_id || 'dev';

  //   Report an event on every page load
  retraced.reportEvent({
    crud: 'u',
    action: randomAction,
    description: 'user <anonymous> reticulated the splines',
    created: new Date(),
    actor: {
      id: actor_id,
      name: actor_name,
    },
    group: {
      id: team_id,
      name: team_id,
    },
    sourceIp: randomIPs,
  });

  // Get A viewer token and send it to the client
  // the client will use this token to initialize the viewer
  console.log('Requesting viewer token for team', team_id);

  retraced
    .getViewerToken(team_id, '', true)
    .then((t) => res.send(JSON.stringify({ token: t, host: `${process.env.RETRACED_HOST}/viewer/v1` })))
    .catch((e) => {
      console.log(e);
      res.status(500).send({ error: 'An Unexpected Error Occured' });
    });

  // res.status(200).json({
  //     host: process.env.RETRACED_HOST,
  //     token: token
  // });
}
