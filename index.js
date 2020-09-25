const util = require('util');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const baseUrl = 'https://www.lazarusnaturals.com';
const productUrls = [
  '/shop/tinctures/cbd-high-potency',
];

var comments = {};

const parseSingleComment = (element, hasChild = false) => {
  let comment = {
    author: element.querySelector('.woocommerce-review__author').textContent,
    time: element.querySelector('.woocommerce-review__published-date').getAttribute('datetime'),
    description: element.querySelector('.description').innerHTML,
  };
  if (!hasChild) {
    let rating = element.querySelector('.star-rating');
    if ( rating != null ) comment.rating = element.querySelector('.star-rating').getAttribute('aria-label').replace(/Rated (\d).*?$/, '$1');
  }
  let child = element.querySelector('.children');
  if (child != null) {
    comment.children = [];
    child.querySelectorAll('.comment').forEach(childElement => {
      comment.children.push(parseSingleComment(childElement, true));
    });
  }
  return comment;
};

const inspectPageForComments = async (url, acc, recursive = true) => {
  // Make a request for a user with a given ID
  return axios.get(url, { responseType: 'document' })
    .then(async function (response) {
      const { document } = (new JSDOM(response.data)).window;
      document.querySelectorAll('ol.commentlist .review').forEach(element => {
        acc.push(parseSingleComment(element));
      });
      if ( recursive ) {
        // Check for more pages
        let page = document.querySelector('.page-numbers.current').textContent;
        let promises = [];
        do {
          // Make rescursive
          let extraUri = '/comment-page-'+page+'#comments';
          promises.push(inspectPageForComments(url+extraUri, acc, false));
          page--;
        } while (page > 1);
        await Promise.all(promises).then(values => {
          // console.log(values);
        });
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
};

productUrls.forEach(async uri => {
  comments.uri = [];
  await inspectPageForComments(baseUrl+uri, comments.uri);
  console.log(comments.uri);
});
