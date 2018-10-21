import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { Switch, List } from 'react-native-paper';

import { ItScreenContainer } from '../components/common';
import {
  SWIPER_LEFT_CHANGED,
  SWIPER_RIGHT_CHANGED,
  SWIPER_TOP_CHANGED,
  SWIPER_PLACE_CHANGED,
  SWIPER_LEFT_SUBSCRIBED,
  SWIPER_LEFT_UNSUBSCRIBED,
  SWIPER_RIGHT_UNSUBSCRIBED,
  SWIPER_RIGHT_SUBSCRIBED,
  SWIPER_TOP_UNSUBSCRIBED,
  SWIPER_TOP_SUBSCRIBED,
} from '../actions/types';

const places = [
  {
    id: 97389,
    label: 'South America',
  },
  {
    id: 97391,
    label: 'Europe',
  },
  {
    id: 97392,
    label: 'Africa',
  },
  {
    id: 97393,
    label: 'Oceania',
  },
  {
    id: 97394,
    label: 'North America',
  },
  {
    id: 97395,
    label: 'Asia',
  },
];

const taxa = [
  {
    id: 1,
    label: 'Animalia',
    subscribe: true,
  },
  {
    id: 47126,
    label: 'Plantae',
    subscribe: true,
  },
  {
    id: 47170,
    label: 'Fungi',
    subscribe: true,
  },
];

class ItSettingsScreen extends Component {
  static navigationOptions = () => ({
    title: 'Swiper settings',
  });

  render() {
    const {
      changeSwipeLeft,
      subscribeSwipeLeft,
      unsubscribeSwipeLeft,
      changeSwipeRight,
      subscribeSwipeRight,
      unsubscribeSwipeRight,
      changeSwipeTop,
      subscribeSwipeTop,
      unsubscribeSwipeTop,
      changeSwipePlace,
      swiper,
    } = this.props;
    const {
      swipeLeft, swipeRight, swipeTop, place,
    } = swiper;
    const { container, subscriptionContainer } = styles;
    return (
      <ItScreenContainer>
        <View style={container}>

          <List.Accordion title={`Filter by place = ${place.label}`}>
            {places.map(p => (
              <List.Item
                key={p.id}
                title={p.label}
                onPress={() => changeSwipePlace(p)}
              />
            ))}
          </List.Accordion>

          <List.Accordion title={`Swipe left = ${swipeLeft.label}`}>
            {taxa.map(taxon => (
              <List.Item
                key={taxon.id}
                title={taxon.label}
                onPress={() => changeSwipeLeft(taxon)}
              />
            ))}
          </List.Accordion>
          <View style={subscriptionContainer}>
            <Text>{`Subscribe to ${swipeLeft.label} identifications`}</Text>
            <Switch
              value={swipeLeft.subscribe}
              onValueChange={() => (swipeLeft.subscribe
                ? unsubscribeSwipeLeft()
                : subscribeSwipeLeft())
              }
            />
          </View>

          <List.Accordion title={`Swipe right = ${swipeRight.label}`}>
            {taxa.map(taxon => (
              <List.Item
                key={taxon.id}
                title={taxon.label}
                onPress={() => changeSwipeRight(taxon)}
              />
            ))}
          </List.Accordion>
          <View style={subscriptionContainer}>
            <Text>{`Subscribe to ${swipeRight.label} identifications`}</Text>
            <Switch
              value={swipeRight.subscribe}
              onValueChange={() => (swipeRight.subscribe
                ? unsubscribeSwipeRight()
                : subscribeSwipeRight())
              }
            />
          </View>

          <List.Accordion title={`Swipe top = ${swipeTop.label}`}>
            {taxa.map(taxon => (
              <List.Item
                key={taxon.id}
                title={taxon.label}
                onPress={() => changeSwipeTop(taxon)}
              />
            ))}
          </List.Accordion>
          <View style={subscriptionContainer}>
            <Text>{`Subscribe to ${swipeTop.label} identifications`}</Text>
            <Switch
              value={swipeTop.subscribe}
              onValueChange={() => (swipeTop.subscribe ? unsubscribeSwipeTop() : subscribeSwipeTop())
              }
            />
          </View>
        </View>
      </ItScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subscriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

const mapStateToProps = state => ({
  swiper: state.swiper,
});

const mapDispatchToProps = dispatch => ({
  changeSwipeLeft: (payload) => {
    dispatch({ type: SWIPER_LEFT_CHANGED, payload });
  },
  subscribeSwipeLeft: (payload) => {
    dispatch({ type: SWIPER_LEFT_SUBSCRIBED, payload });
  },
  unsubscribeSwipeLeft: (payload) => {
    dispatch({ type: SWIPER_LEFT_UNSUBSCRIBED, payload });
  },
  changeSwipeRight: (payload) => {
    dispatch({ type: SWIPER_RIGHT_CHANGED, payload });
  },
  subscribeSwipeRight: (payload) => {
    dispatch({ type: SWIPER_RIGHT_SUBSCRIBED, payload });
  },
  unsubscribeSwipeRight: (payload) => {
    dispatch({ type: SWIPER_RIGHT_UNSUBSCRIBED, payload });
  },
  changeSwipeTop: (payload) => {
    dispatch({ type: SWIPER_TOP_CHANGED, payload });
  },
  subscribeSwipeTop: (payload) => {
    dispatch({ type: SWIPER_TOP_SUBSCRIBED, payload });
  },
  unsubscribeSwipeTop: (payload) => {
    dispatch({ type: SWIPER_TOP_UNSUBSCRIBED, payload });
  },
  changeSwipePlace: (payload) => {
    dispatch({ type: SWIPER_PLACE_CHANGED, payload });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ItSettingsScreen);
