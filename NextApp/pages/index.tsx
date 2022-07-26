import type { NextPage } from 'next';
import DataTable, { TableColumn } from 'react-data-table-component';
import { getNearbyPlaces } from '../api/get-places-nearby';
import { getGoogleMapsApiKey } from '../api/get-google-maps-api-key';
import CustomGoogleMap from '../components/CustomGoogleMap';
import Header from '../components/Header';
import styles from '../styles/utils.module.css';
import { Place } from '../types/Place';
import { isNotDefined } from '../utils/utils';

interface IProps {
  places: Place[];
  googleMapsApiKey: string;
}
const Home: NextPage<IProps> = (props: IProps) => {
  return (
    <div>
      <Header />

      <div className={styles.main}>
        <h1 className={styles.title}>Welcome to Food Advisor!</h1>

        <CustomGoogleMap googleMapsApiKey={props.googleMapsApiKey} />

        <div className={styles.main}>
          <DataTable
            defaultSortFieldId={2} // sorted by adjusted rating from high to low
            defaultSortAsc={false}
            columns={getTableHeaders()}
            data={props.places}
            highlightOnHover
          />
        </div>
      </div>
    </div>
  );
};

export default Home;

export async function getStaticProps() {
  return {
    props: {
      places: await getNearbyPlaces(40.799465, -73.966473, 250),
      googleMapsApiKey: await getGoogleMapsApiKey(),
    },
  };
}

const getTableHeaders = (): TableColumn<Place>[] => {
  return [
    {
      name: 'Name',
      sortable: true,
      selector: (row: Place) => row.name,
    },
    // {
    //   name: 'Num Photos',
    //   sortable: true,
    //   selector: (row: Place) => row.numPhotos,
    //   width: '140px',
    // },
    {
      name: 'Adjusted Rating',
      sortable: true,
      selector: (row: Place) => roundValue(row.computedMetrics?.adjustedRating) ?? 'N/A',
      width: '140px',
    },
    // {
    //   name: 'Local Guide Percentage',
    //   sortable: true,
    //   selector: (row: Place) => formatPercentage(row.computedMetrics?.localGuidePercentage) ?? 'N/A',
    //   width: '200px',
    // },
    {
      name: 'Local Guide Percentile',
      sortable: true,
      selector: (row: Place) => formatPercentage(row.computedMetrics?.localGuidePercentile) ?? 'N/A',
      width: '180px',
    },
    {
      name: 'Num Ratings Percentile',
      sortable: true,
      selector: (row: Place) => formatPercentage(row.computedMetrics?.userRatingsTotalPercentile) ?? 'N/A',
      width: '200px',
    },
    {
      name: 'Rating',
      sortable: true,
      selector: (row: Place) => row.rating ?? 'N/A',
      width: '140px',
    },
    {
      name: 'Num Ratings',
      sortable: true,
      selector: (row: Place) => row.userRatingsTotal ?? 'N/A',
      width: '140px',
    },
    // {
    //   name: 'Types',
    //   sortable: true,
    //   selector: (row: Place) => row.types.join(', '),
    // },
    // {
    //   name: 'Address',
    //   sortable: true,
    //   selector: (row: Place) => row.vicinity,
    // },
    {
      name: 'Place ID',
      sortable: true,
      selector: (row: Place) => row._id,
      width: '140px',
    },
  ];
};

const formatPercentage = (value: number) => {
  if (isNotDefined(value)) {
    return value;
  }
  return `${roundValue(value)}%`;
};

const roundValue = (value: number) => {
  if (isNotDefined(value)) {
    return value;
  }
  return value.toFixed(2);
};
