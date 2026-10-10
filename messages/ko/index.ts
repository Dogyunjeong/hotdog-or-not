// One JSON file per namespace so each UI area owns its own messages (no merge conflicts).
import common from './common.json';
import classifier from './classifier.json';
import details from './details.json';
import history from './history.json';
import detailView from './detailView.json';
import onboarding from './onboarding.json';
import cookieConsent from './cookieConsent.json';
import footer from './footer.json';
import cookiePolicy from './cookiePolicy.json';
import privacy from './privacy.json';
import errors from './errors.json';

const messages = {
  common,
  classifier,
  details,
  history,
  detailView,
  onboarding,
  cookieConsent,
  footer,
  cookiePolicy,
  privacy,
  errors,
};

export default messages;
