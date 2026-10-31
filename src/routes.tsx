/* eslint-disable jsx-a11y/aria-role */
import { Navigate, type RouteObject } from 'react-router-dom';
import { DoctorCasePage } from './presentation/doctor/DoctorCasePage';
import { DoctorQueuePage } from './presentation/doctor/DoctorQueuePage';
import { RoleSelectPage } from './presentation/entry/RoleSelectPage';
import { RedirectWithId } from './presentation/layout/RedirectWithId';
import { RootLayout } from './presentation/layout/RootLayout';
import { WorkspaceLayout } from './presentation/layout/WorkspaceLayout';
import { NotFoundPage } from './presentation/NotFoundPage';
import { OperationsOrderPage } from './presentation/operations/OperationsOrderPage';
import { OperationsQueuePage } from './presentation/operations/OperationsQueuePage';
import { CheckoutPage, ConfirmationPage, PrescriptionSummaryPage } from './presentation/patient/CheckoutPages';
import { DashboardPage } from './presentation/patient/DashboardPage';
import { AssessmentPage, EpisodePage } from './presentation/patient/EpisodePages';
import { HelpPage, InPersonCarePage, PrivacyPage, TeleconsultPage } from './presentation/patient/HelpPages';
import { ConsentPage, IntakeEntryPage, IntakePage, WhoForPage } from './presentation/patient/IntakePages';
import { PatientOrderPage, TrackingRedirect } from './presentation/patient/OrderPage';
import { RecordDetailPage, RecordsPage } from './presentation/patient/RecordsPages';
import { PharmacistCheckPage } from './presentation/pharmacist/PharmacistCheckPage';
import { PharmacistQueuePage } from './presentation/pharmacist/PharmacistQueuePage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootLayout><NotFoundPage standalone /></RootLayout>,
    children: [
      { index: true, element: <RoleSelectPage /> },
      {
        path: 'patient',
        element: <WorkspaceLayout role="patient" />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'intake', element: <IntakeEntryPage /> },
          { path: 'episodes/:episodeId', element: <EpisodePage /> },
          { path: 'episodes/:episodeId/consent', element: <ConsentPage /> },
          { path: 'episodes/:episodeId/who-for', element: <WhoForPage /> },
          { path: 'episodes/:episodeId/intake', element: <IntakePage /> },
          { path: 'episodes/:episodeId/assessment', element: <AssessmentPage /> },
          { path: 'episodes/:episodeId/prescription', element: <PrescriptionSummaryPage /> },
          { path: 'episodes/:episodeId/checkout', element: <CheckoutPage /> },
          { path: 'episodes/:episodeId/confirmation', element: <ConfirmationPage /> },
          { path: 'episodes/:episodeId/tracking', element: <TrackingRedirect /> },
          { path: 'episodes/:episodeId/teleconsult', element: <TeleconsultPage /> },
          { path: 'episodes/:episodeId/in-person-care', element: <InPersonCarePage /> },
          { path: 'orders/:orderId', element: <PatientOrderPage /> },
          { path: 'records', element: <RecordsPage /> },
          { path: 'records/:episodeId', element: <RecordDetailPage /> },
          { path: 'help', element: <HelpPage /> },
          { path: 'in-person-care', element: <InPersonCarePage /> },
          { path: 'privacy', element: <PrivacyPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'doctor',
        element: <WorkspaceLayout role="doctor" />,
        children: [
          { index: true, element: <DoctorQueuePage /> },
          { path: 'cases/:episodeId', element: <DoctorCasePage /> },
          { path: 'review/:episodeId', element: <RedirectWithId to={(id) => `/doctor/cases/${id}`} /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'pharmacist',
        element: <WorkspaceLayout role="pharmacist" />,
        children: [
          { index: true, element: <PharmacistQueuePage /> },
          { path: 'checks/:episodeId', element: <PharmacistCheckPage /> },
          { path: 'check/:episodeId', element: <RedirectWithId to={(id) => `/pharmacist/checks/${id}`} /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'operations',
        element: <WorkspaceLayout role="ops" />,
        children: [
          { index: true, element: <OperationsQueuePage /> },
          { path: 'orders/:orderId', element: <OperationsOrderPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      { path: 'ops', element: <Navigate replace to="/operations" /> },
      { path: '*', element: <NotFoundPage standalone /> },
    ],
  },
];
