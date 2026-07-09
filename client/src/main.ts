// Import Global Styles
import './assets/css/satoshi.css';
import './assets/css/style.css';
import './assets/css_home_pages/baitulmal.css';
import './assets/css_home_pages/input-login.css';
import './assets/css_home_pages/input.css';
import './assets/css_home_pages/login.css';

import 'flowbite';

// Vue Core
import rupiahPlugin from '@/plugins/rupiahPlugin';
import terbilangPlugin from '@/plugins/terbilangPlugin';
import { createHead } from '@vueuse/head';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css'; // atau theme lain seperti semantic.min.css
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// PrimeVue
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';

// Chart
import VueApexCharts from 'vue3-apexcharts';

// FontAwesome Setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// import Confirm from 'confirmjs'

// <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" />
// FontAwesome Icons - Solid
import {
  faArrowLeft,
  faArrowRight,
  faBackward,
  faBalanceScale,
  faBalanceScaleLeft,
  faBan,
  faBook,
  faBox,
  faBoxOpen,
  faBriefcase,
  faBuilding,
  faBuildingColumns,
  faCalculator,
  faCalendar,
  faCalendarCheck,
  faCalendarDays,
  faCar,
  faCaretRight,
  faChartArea,
  faChartLine,
  faCheck,
  faCircleArrowRight,
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
  faCity,
  faClipboardCheck,
  faClipboardList,
  faClipboardQuestion,
  faClipboardUser,
  faClock,
  faClockRotateLeft,
  faCloudArrowDown,
  faCloudArrowUp,
  faCodeBranch,
  faCogs,
  faCoins,
  faCommentDollar,
  faComments,
  faDatabase,
  faDownload,
  faEnvelope,
  faExchange,
  faEye,
  faEyeSlash,
  faFile,
  faFileContract,
  faFileExport,
  faFileImport,
  faFileLines,
  faFilePen,
  faFileSignature,
  faForward,
  faGear,
  faGift,
  faGlobe,
  faGripVertical,
  faHandHoldingDollar,
  faHandHoldingDroplet,
  faHandHoldingHand,
  faHandHoldingHeart,
  faHandHoldingMedical,
  faHandshake,
  faHandshakeAngle,
  faHandsHoldingCircle,
  faHome,
  faHotel,
  faHouseCrack,
  faImage,
  faInbox,
  faInfo,
  faLayerGroup,
  faList,
  faListAlt,
  faListCheck,
  faListOl,
  faLock,
  faLockOpen,
  faMap,
  faMapLocationDot,
  faMessage,
  faMoneyBill,
  faMoneyBillAlt,
  faMoneyBillWave,
  faMoneyCheckAlt,
  faMosque,
  faPaperPlane,
  faPassport,
  faPen,
  faPencil,
  faPeopleCarry,
  faPeopleGroup,
  faPiggyBank,
  faPlane,
  faPlaneArrival,
  faPlaneCircleCheck,
  faPlus,
  faPrint,
  faQrcode,
  faQuestionCircle,
  faRightFromBracket,
  faRoute,
  faScroll,
  faShieldAlt,
  faSpinner,
  faSubway,
  faTableCellsLarge,
  faTableList,
  faTicket,
  faTicketSimple,
  faTimes,
  faToggleOff,
  faToggleOn,
  faTriangleExclamation,
  faUndoAlt,
  faUpload,
  faUser,
  faUserCheck,
  faUserClock,
  faUserCog,
  faUserPlus,
  faUsers,
  faUserShield,
  faUserTie,
  faUserPen,
} from '@fortawesome/free-solid-svg-icons';

// FontAwesome Icons - Regular
import { faCircle, faUser as farUser } from '@fortawesome/free-regular-svg-icons';

// FontAwesome Icons - Brands
import { faCcVisa, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Tambahkan semua icon ke library FontAwesome
library.add(
  // Solid Icons
  faPrint,
  faUser,
  faUserCheck,
  faHome,
  faHouseCrack,
  faCaretRight,
  faExchange,
  faBoxOpen,
  faUsers,
  faGlobe,
  faDatabase,
  faChartArea,
  faCogs,
  faBackward,
  faForward,
  faBook,
  faArrowRight,
  faPlus,
  faMoneyBill,
  faPencil,
  faTimes,
  faBox,
  faMoneyBillAlt,
  faUndoAlt,
  faListAlt,
  faImage,
  faTicket,
  faCircleArrowRight,
  faQrcode,
  faCalendar,
  faArrowLeft,
  faHandHoldingDollar,
  faMoneyCheckAlt,
  faCity,
  faCar,
  faHotel,
  faPassport,
  faSubway,
  faClipboardList,
  faPiggyBank,
  faUserCog,
  faUserTie,
  faCalculator,
  faList,
  faBalanceScale,
  faBalanceScaleLeft,
  faCommentDollar,
  faShieldAlt,
  faEnvelope,
  faClipboardCheck,
  faLayerGroup,
  faPeopleCarry,
  faTicketSimple,
  faMoneyBillWave,
  faPlane,
  faBuilding,
  faPlaneArrival,
  faCircle,
  faClock,
  farUser,
  faCcVisa,
  faWhatsapp,
  faEye,
  faEyeSlash,
  faCloudArrowUp,
  faCodeBranch,
  faLock,
  faLockOpen,
  faPlaneCircleCheck,
  faHandshake,
  faGear,
  faRightFromBracket,
  faPeopleGroup,
  faHandHoldingHeart,
  faClockRotateLeft,
  faCoins,
  faChartLine,
  faQuestionCircle,
  faListOl,
  faFileSignature,
  faClipboardCheck,
  faFileContract,
  faListCheck,
  faBriefcase,
  faMap,
  faMapLocationDot,
  faBuildingColumns,
  faFileLines,
  faHandHoldingMedical,
  faHandHoldingHand,
  faHandsHoldingCircle,
  faRoute,
  faHandHoldingDroplet,
  faHandshakeAngle,
  faUserShield,
  faScroll,
  faMessage,
  faClipboardUser,
  faUserPlus,
  faUserClock,
  faClipboardQuestion,
  faCloudArrowDown,
  faBan,
  faToggleOn,
  faToggleOff,
  faDownload,
  faGripVertical,
  faFileExport,
  faFilePen,
  faTableList,
  faFileImport,
  faCalendarCheck,
  faTableCellsLarge,
  faInfo,
  faCalendarDays,
  faPen,
  faCheck,
  faMosque,
  faCoins,
  faGift,
  faCircleCheck,
  faSpinner,
  faPaperPlane,
  faComments,
  faCircleXmark,
  faClock,
  faFile,
  faTriangleExclamation,
  faCircleInfo,
  faEye,
  faInbox,
  faUpload,
  faUserPen,
);

// Buat App Vue
const app = createApp(App);
const head = createHead();

// Gunakan Plugin dan Komponen
app.use(router);
app.use(createPinia());
app.use(VueApexCharts);
app.use(head);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(rupiahPlugin);
app.use(terbilangPlugin);

router.beforeEach((to, from, next) => {
  const defaultTitle = 'Nama Aplikasi Anda';
  document.title = to.meta.title || defaultTitle;
  next();
});

// Register FontAwesome Component
app.component('font-awesome-icon', FontAwesomeIcon);
app.config.globalProperties.$alertify = alertify;
// Mount ke DOM
app.mount('#app');
