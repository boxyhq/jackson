import tap from 'tap';
import { createRequestForm } from '../src/controller/utils';

tap.test('createRequestForm', async (t) => {
  const relayState = 'boxyhq_jackson_17b723c56a2fdc4e94f5e5fa792f89e3';
  const samlRequest = 'PHNhbWxwOkxvZ291dFJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6c';
  const postUrl = 'https://auth0.com/samlp';

  const form = createRequestForm(relayState, samlRequest, postUrl);

  t.ok(form.includes(`<form method="post" action="${encodeURI(postUrl)}">`));
  t.ok(form.includes(`<input type="hidden" name="RelayState" value="${relayState}"/>`));
  t.ok(form.includes(`<input type="hidden" name="SAMLRequest" value="${samlRequest}"/>`));
  t.ok(form.includes(`<input type="submit" value="Continue" />`));

  t.end();
});
