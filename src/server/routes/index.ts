import { Hono } from 'hono';

const router = new Hono();

// Add routes here
import projectsRouter from './projects';
import pagesRouter from './pages';
import componentsRouter from './components';
import authRouter from './auth';
import gitRouter from './git';
import aiRouter from './ai';
import feedbackRouter from './feedback';
import deploymentsRouter from './deployments';
import commerceRouter from './commerce';
import domainsRouter from './domains';
import accountRouter from './account';
import supportRouter from './support';

router.route('/projects', projectsRouter);
router.route('/pages', pagesRouter);
router.route('/components', componentsRouter);
router.route('/auth', authRouter);
router.route('/git', gitRouter);
router.route('/ai', aiRouter);
router.route('/feedback', feedbackRouter);
router.route('/deployments', deploymentsRouter);
router.route('/domains', domainsRouter);
router.route('/account', accountRouter);
router.route('/', commerceRouter);
router.route('/support', supportRouter);

export default router;
