import React, { Component } from 'react';
import { View, Alert } from 'react-native';
import {
  Button,
  List,
  Dialog,
  Portal,
  FAB,
  Checkbox,
  Text,
} from 'react-native-paper';
import { connect } from 'react-redux';
import inatjs from 'inaturalistjs';

import ItObservationSwiper from '../components/features/ItObservationSwiper';
import {
  ItScreenContainer,
  ItSpinner,
  ItHeaderButtons,
  HeaderItem,
} from '../components/common';

import {
  OBSERVATION_SKIPPED,
} from '../actions/types';

class IiIdentifyScreen extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('title'),
    headerRight: (
      <ItHeaderButtons>
        <HeaderItem
          testID="header_info_button"
          title="info"
          iconName="info"
          onPress={() => navigation.getParam('showDialog')()}
        />
      </ItHeaderButtons>
    ),
  });

  INITIAL_STATE = {
    user: {},
    apiToken: this.props.navigation.state.params.apiToken,
    swipeDirection: '',
    cardIndex: 0,
    observations: [],
    page: 0,
    visible: false,
  };

  constructor(props) {
    super(props);
    this.state = this.INITIAL_STATE;
  }

  componentDidMount = async () => {
    const { navigation, swiper } = this.props;
    const { place } = swiper;
    navigation.setParams({ title: place.label, showDialog: this.showDialog });
    // TODO: refactor to app start up, if we ever have different screens
    const user = await this.getCurrentUser();
    console.log('user', user);
    if (user) {
      // Get first batch of unidentified observations
      this.searchObservations();
    }
  };

  shouldComponentUpdate(nextProps, nextState) {
    const { swiper } = this.props;
    if (swiper !== nextProps.swiper) {
      return false;
    }
    return true;
  }

  onSwipedLeft(index) {
    const { observations } = this.state;
    const { swiper } = this.props;
    const { swipeLeft } = swiper;
    this.setState({ cardIndex: index + 1 });
    // Use set id for this identification
    this.identifyInAnimationFrame(observations[index], swipeLeft);
  }

  onSwipedRight(index) {
    const { observations } = this.state;
    const { swiper } = this.props;
    const { swipeRight } = swiper;
    this.setState({ cardIndex: index + 1 });
    // Use set id for this identification
    this.identifyInAnimationFrame(observations[index], swipeRight);
  }

  onSwipedTop(index) {
    const { observations } = this.state;
    const { swiper } = this.props;
    const { swipeTop } = swiper;
    this.setState({ cardIndex: index + 1 });
    // Use set id for this identification
    this.identifyInAnimationFrame(observations[index], swipeTop);
  }

  onSwipedBottom(index) {
    const { observations } = this.state;
    const { observationSkipped } = this.props;
    this.setState({ cardIndex: index + 1 });
    // Add the skipped observation's id to the observation reducer
    observationSkipped(observations[index].id);
  }

  onSwipedAllCards = () => {
    this.setState({ observations: [] });
    // Get new batch of unidentified observation
    this.searchObservations();
  };

  getCurrentUser = async () => {
    const { apiToken } = this.state;
    const options = { api_token: apiToken };
    return await inatjs.users
      .me(options)
      .then(r => {
        this.setState({ user: r.results[0] });
        return r;
      })
      // TODO: UI response
      .catch(e => {
        console.log('Error in fetching current user', e);
        console.log(e.response);
        // Show alert for failure of getting user object from iNat
        Alert.alert(
          'Sorry',
          'Unfortunately, something went wrong. You can not proceed.'
        );
      });
  };

  searchObservations() {
    const { user, page } = this.state;
    const { swiper } = this.props;
    const { place, maxPhotos, sortOrder } = swiper;
    const params = {
      iconic_taxa: 'unknown',
      quality_grade: 'needs_id',
      per_page: 100,
      page: page + 1,
      // Must be observed within the place with this ID
      place_id: place.id,
      // Observations have been reviewed by the user with ID equal to the value of the viewer_id parameter
      viewer_id: user.id,
      reviewed: 'false',
      photos: 'true',
      order: sortOrder,
      order_by: 'created_at'
    };

    inatjs.observations
      .search(params)
      .then((rsp) => {
        const filteredResults = rsp.results
          .filter(d => !d.species_guess)
          .filter(d => d.photos.length <= maxPhotos);
        this.setState({
          observations: filteredResults,
          page: rsp.page,
          cardIndex: 0
        }, () => {
          if (filteredResults.length === 0) {
            this.searchObservations();
          }
        });
      })
      .catch(e => {
        console.log('Error in fetching list of observations', e);
        console.log(e.response);
        Alert.alert(
          'Sorry',
          'Unfortunately, something went wrong. You can not proceed.'
        );
      });
  }

  identifyInAnimationFrame(observation, swipeOption) {
    requestAnimationFrame(() => {
      this.identify(observation, swipeOption);
    });
  }

  identify(observation, swipeOption) {
    console.log('observation', observation);
    const { apiToken } = this.state;
    /*
    {
      "identification": {
        "observation_id": 0,
        "taxon_id": 0,
        "current": true,
        "body": "string"
      }
    }
    */
    const identification = {
      identification: {
        observation_id: observation.id,
        taxon_id: swipeOption.id
      }
    };
    const options = { api_token: apiToken };
    inatjs.identifications
      .create(identification, options)
      .then((c) => {
        console.log('identification', c);
        if (!swipeOption.subscribe) {
          inatjs.observations
            .subscribe(observation, options)
            .then(rsp => console.log('Unsubscriped to: ', rsp))
            .catch((e) => {
              console.log('Error in unsubscribing to observation', e);
              console.log(e.response);
            });
        }
      })
      .catch((e) => {
        console.log('Error in creating identification', e);
        console.log(e.response);
        Alert.alert(
          'Sorry',
          'Unfortunately, something went wrong. Your identification was not processed.'
        );
      });
  }

  showDialog = () => {
    this.setState({ visible: true });
  };

  hideDialog = () => {
    this.setState({ visible: false });
  };

  showCommentDialog = () => {
    this.setState({ commentVisible: true });
  };

  hideCommentDialog = () => {
    this.setState({ commentVisible: false });
  };

  skipAndReview = () => {
    const { observations, cardIndex, apiToken } = this.state;
    const options = { api_token: apiToken };
    inatjs.observations
      .review(observations[cardIndex], options)
      .then(rsp => console.log('Reviewed: ', rsp))
      .catch((e) => {
        console.log('Error in reviewing observation', e);
        console.log(e.response);
        Alert.alert(
          'Sorry',
          'Unfortunately, something went wrong. The observation was skipped but not marked as reviewed.',
        );
      });
    this.swiper.swipeBottom();
  }

  addComment = (commentText) => {
    const { observations, cardIndex, apiToken } = this.state;
    this.setState({ commentLoading: true });
    const params = {
      comment: {
        body: commentText,
        parent_type: 'Observation',
        parent_id: observations[cardIndex].id,
      },
    };
    const options = { api_token: apiToken };
    inatjs.comments.create(params, options)
      .then((c) => {
        console.log('New comment', c);
        Alert.alert(
          'Success',
          'The comment was added. However, it will not show here only in the website.',
        );
        this.setState({ commentLoading: false });
        this.hideCommentDialog();
      })
      .catch((e) => {
        console.log('Error in adding comment', e);
        console.log(e.response);
        Alert.alert(
          'Sorry',
          'Unfortunately, something went wrong. The comment could not be added.',
        );
        this.setState({ commentLoading: false });
        this.hideCommentDialog();
      });
  }

  renderFAB() {
    const { fabOpen } = this.state;
    return (
      <FAB.Group
        color="#FFFFFF"
        open={fabOpen}
        icon={fabOpen ? 'close' : 'build'}
        actions={[
          {
            icon: 'comment',
            label: 'Add comment',
            onPress: () => this.showCommentDialog(),
          },
          {
            icon: 'keyboard-arrow-down',
            label: 'Skip and review',
            onPress: () => this.skipAndReview(),
          },
        ]}
        onStateChange={({ open }) => this.setState({ fabOpen: open })}
      />
    );
  }

  renderInfoModal() {
    const { visible } = this.state;
    const { swiper } = this.props;
    const { swipeTop, swipeLeft, swipeRight } = swiper;
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={this.hideDialog}>
          <Dialog.Title>Your current settings</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title={swipeTop.label}
              left={() => <List.Icon icon="keyboard-arrow-up" />}
            />
            <List.Item
              title={swipeLeft.label}
              left={() => <List.Icon icon="keyboard-arrow-left" />}
            />
            <List.Item
              title={swipeRight.label}
              left={() => <List.Icon icon="keyboard-arrow-right" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={this.hideDialog}>Thanks</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  renderCommentDialog() {
    const { commentVisible, checkedIndex, commentLoading } = this.state;
    const { predefinedComments } = this.props;
    return (
      <Portal>
        <Dialog visible={commentVisible} onDismiss={this.hideCommentDialog}>
          <Dialog.Title>Predefined comments</Dialog.Title>
          <Dialog.Content>
            {
              predefinedComments.map((predefinedComment, commentIndex) => {
                if (!predefinedComment) {
                  return null;
                }
                return (
                  <View
                    key={commentIndex}
                    style={{ flexDirection: 'row', padding: 4 }}
                  >
                    <Checkbox
                      uncheckedColor="#888888"
                      status={checkedIndex === commentIndex ? 'checked' : 'unchecked'}
                      onPress={() => {
                        this.setState({
                          checkedIndex: commentIndex,
                        });
                      }}
                    />
                    <Text
                      onPress={() => {
                        this.setState({
                          checkedIndex: commentIndex,
                        });
                      }}
                    >
                      {predefinedComment}
                    </Text>
                  </View>
                );
              })
            }
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={this.hideCommentDialog}>Cancel</Button>
            <Button
              onPress={() => this.addComment(predefinedComments[checkedIndex])}
              disabled={!checkedIndex || commentLoading}
              loading={commentLoading}
            >
              Add Comment
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  render() {
    const { observations, cardIndex } = this.state;
    const { swiper } = this.props;
    if (!observations || !observations.length > 0) {
      return <ItSpinner size="large" />;
    }
    return (
      <ItScreenContainer>
        <ItObservationSwiper
          swiperRef={(swiperRef) => {
            this.swiper = swiperRef;
          }}
          observations={observations}
          cardIndex={cardIndex}
          swiper={swiper}
          onSwipedLeft={index => this.onSwipedLeft(index)}
          onSwipedRight={index => this.onSwipedRight(index)}
          onSwipedTop={index => this.onSwipedTop(index)}
          onSwipedBottom={index => this.onSwipedBottom(index)}
          onSwipedAll={this.onSwipedAllCards}
        />
        {this.renderInfoModal()}
        {this.renderCommentDialog()}
        {this.renderFAB()}
      </ItScreenContainer>
    );
  }
}

const mapStateToProps = state => ({
  swiper: state.swiper,
  predefinedComments: state.comment.predefinedComments,
});

const mapDispatchToProps = dispatch => ({
  observationSkipped: (payload) => {
    dispatch({ type: OBSERVATION_SKIPPED, payload });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(IiIdentifyScreen);
