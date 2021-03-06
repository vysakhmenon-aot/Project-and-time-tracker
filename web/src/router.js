import Vue from 'vue';
import Router from 'vue-router';
import Dashboard from './components/dashboard/Dashboard.vue';
import Authorize from './components/login/Authorize.vue';
import Project from './components/timeMachine/projects/Project.vue';
import TimeMachineIntakeForm from './components/timeMachine/projectIntake/IntakeForm.vue';
import TimeMachineIntakeRequests from './components/timeMachine/projectIntake/IntakeRequests.vue';
import TimeMachineIntakeSuccess from './components/timeMachine/projectIntake/IntakeSuccess.vue';
import TimeMachineProjects from './components/timeMachine/projects/Projects.vue';
import TimeMachineTimesheets from './components/timeMachine/timesheets/Timesheets.vue';
import Unauthorized from './components/error/Unauthorized.vue';
import security from '@/modules/security';
import store from '@/store';

Vue.use(Router);

const routes = [
  // Main app
  {
    exact: true,
    path: '/',
    name: 'main',
    redirect: '/authorize',
    meta: { requiresAuth: true },
    // route level code-splitting
    // this generates a separate chunk (filename.[hash].js) for this route
    // which is lazy-loaded when the route is visited
  },
  {
    exact: true,
    path: '/authorize',
    name: 'authorize',
    component: Authorize,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin', 'User'] },
  },
  {
    exact: true,
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  {
    exact: true,
    path: '/intake',
    name: 'timeMachineIntakeForm',
    component: TimeMachineIntakeForm,
    meta: { requiresAuth: true, roles: ['User', 'PSB_Admin'] },
  },
  {
    path: '/intake/:id',
    name: 'timeMachineIntakeFormDetails',
    component: TimeMachineIntakeForm,
    meta: { requiresAuth: true, roles: ['PSB_Admin'] },
  },
  {
    exact: true,
    path: '/intake-success',
    name: 'TimeMachineIntakeSuccess',
    component: TimeMachineIntakeSuccess,
    meta: { requiresAuth: true, roles: ['User', 'PSB_Admin'] },
  },
  {
    exact: true,
    path: '/intake-requests',
    name: 'timeMachineIntakeRequests',
    component: TimeMachineIntakeRequests,
    meta: { requiresAuth: true, roles: ['PSB_Admin'] },
  },
  {
    exact: true,
    path: '/projects',
    name: 'timeMachineProjects',
    component: TimeMachineProjects,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  {
    path: '/project',
    name: 'project',
    component: Project,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  {
    path: '/project/:id',
    name: 'projectDetails',
    component: Project,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  {
    exact: true,
    path: '/timesheets',
    name: 'timeMachineTimesheets',
    component: TimeMachineTimesheets,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  {
    path: '/timesheets/:id',
    name: 'timeMachineTimesheetsDetails',
    component: TimeMachineTimesheets,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  {
    exact: true,
    path: '/export',
    name: 'export',
    component: null,
    meta: { requiresAuth: true, roles: ['PSB_User', 'PSB_Admin'] },
  },
  // Error routes
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    props: true,
    component: Unauthorized,
  },
];

const router = new Router({
  mode: 'history',
  base: '/',
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.path === '/logout') {
    router.push({ path: '/' }); // set default path before logout. this is required if the user tries to login with different role user, to redirect to the default page.
    security.logout();
  }

  if (to.meta.requiresAuth) {
    const { auth } = store.state.security;
    if (!auth.authenticated) {
      const isAuthPage = (to.name === 'authorize');
      security.init(next, to.meta.roles, isAuthPage);
    } else if (to.meta.roles) {
      if (security.roles(to.meta.roles)) {
        next();
      } else {
        next({ name: 'Unauthorized' });
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
