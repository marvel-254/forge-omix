import { Hono } from 'hono';

const router = new Hono();

// Add routes here
import projectsRouter from './projects';
import pagesRouter from './pages';
import componentsRouter from './components';
import authRouter from './auth';

router.route('/projects', projectsRouter);
router.route('/pages', pagesRouter);
router.route('/components', componentsRouter);
router.route('/auth', authRouter);

export default router;
