import React from 'react';
import GoogleMapReact from 'google-map-react';

interface IProps {
  googleMapsApiKey: string;
}

export default function CustomGoogleMap(props: IProps) {
  const defaultProps = {
    center: {
      lat: 40.801412,
      lng: -73.97015,
    },
    zoom: 11,
  };

  return (
    // Important! Always set the container height explicitly
    <div style={{ height: '50vh', width: '50%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: props.googleMapsApiKey }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
      >
        {/* <Marker /> */}
        <div>here!</div>
      </GoogleMapReact>
    </div>
  );
}
