(function($m, $j) {

    "use strict";

    /**
     * @factory $productHelper
     * @contributors Adam Timberlake
     */
    $m.factory('$productHelper',

        ['$rootScope', '$crossfilterHelper', '$http', '$q',

        function ProductHelper($rootScope, $crossfilterHelper, $http, $q) {

            /**
             * @property _defaultDimension
             * @type {String}
             * @default 'id'
             */
            var _defaultDimension = 'name';

            /**
             * @property $service
             * @type {Object}
             */
            var $service = {};

            /**
             * @property products
             * @type {Array}
             * @default []
             */
            $service.products = [];

            /**
             * @property loaded
             * @type {Boolean}
             * @default false
             */
            $service.loaded = false;

            // Create our request and our promise which will be resolved when the AJAX
            // request is successful.
            var request     = $http({method: 'GET', url: '/Magento-on-Angular/api/public/products'}),
                deferred    = $q.defer();

            request.success(function ajaxSuccess(response) {

                // Initiate our Crossfilter object.
                var crossfilter = $crossfilterHelper.create(response);

                // Create all of the necessary dimensions.
                $crossfilterHelper.addDimension('id', 'id');
                $crossfilterHelper.addDimension('name', 'name');
                $crossfilterHelper.addDimension('price', 'price');
                $crossfilterHelper.addDimension('categories', 'categories');
                $crossfilterHelper.addDimension('colours', 'colour');
                $crossfilterHelper.addDimension('manufacturers', 'manufacturer');

                // Resolve our promise!
                deferred.resolve();

                $service.loaded = true;

            });

            /**
             * @on attributeUpdated
             * @broadcasts contentUpdated
             * Responsible for updating the products based on any attribute that has
             * been changed by anything anywhere.
             */
            $rootScope.$on('attributeUpdated', function onAttributeUpdated(event, type, ids) {

                // Find the dimension from the type of the attribute.
                var dimension = $crossfilterHelper.get(type);

                // Update the filter based on the active IDs that have been passed through.
                dimension.filterFunction(function attributeDimension(id) {
                    return ($j.inArray(id, ids) === -1);
                });

                // Finally we can let everybody know that we've updated the content.
                $rootScope.$broadcast('contentUpdated', $service.getProducts());

            });

            /**
             * @method sortBy
             * @param property {String}
             * Responsible for sorting the products by any given property.
             * @return {Boolean}
             */
            $service.sortBy = function sortBy(property) {

                // Since Crossfilter orders by the dimension in which you obtain the `top` (or `bottom)
                // from, we can simply update that variable which determines the default dimension, and
                // whenever Crossfilter attempts to obtain the `top` it will automatically be ordered
                // by that property.
                _defaultDimension = property;

                // Broadcast the `contentUpdated` event using the updated default dimension property.
                $rootScope.$broadcast('contentUpdated', $service.getProducts());

                return true;

            };

            /**
             * @method hasLoaded
             * Determines whether the products have been loaded yet.
             * @return {Object}
             */
            $service.hasLoaded = function hasLoaded() {
                return deferred.promise;
            };

            /**
             * @method getProducts
             * @return {Array}
             */
            $service.getProducts = function getProducts() {
                return $crossfilterHelper.get(_defaultDimension).top(Infinity).reverse();
            };

            /**
             * @method _applyDimension
             * @param name {String}
             * @param $block {Function}
             * @private
             */
            var _applyDimension = function _applyDimension(name, $block) {

                // Find the dimension that pertains to the name passed.
                var dimension = $crossfilterHelper.get(name);

                if (!dimension) {
                    return;
                }

                // Apply the Crossfilter based on the block.
                $block.apply(dimension);

                // Let all the folks know we've updated the content.
                $rootScope.$broadcast('contentUpdated', $service.getProducts());

            };

            /**
             * @method setQuery
             * @broadcasts contentUpdated
             * @param query {String}
             * Responsible for updating the products based on their name matching against the
             * user query.
             * @return {void}
             */
            $service.setQuery = function setQuery(query) {

                if (!query) {
                    // If there is no query then it's a simple `filterAll`!
                    _applyDimension('name', function() {
                        this.filterAll();
                    });
                    return;
                }

                var regExp = new RegExp(query, 'i');

                // Otherwise it's a regular expression match.
                _applyDimension('name', function() {

                    this.filterFunction(function(name) {
                        return name.match(regExp);
                    });
                });

            };

            /**
             * @method setCategoryId
             * @broadcasts contentUpdated
             * @param id {Number}
             * @return {void}
             */
            $service.setCategoryId = function setCategoryId(id) {

                _applyDimension('categories', function(d) {

                    this.filterFunction(function(ids) {
                        return ($j.inArray(id, ids) !== -1);
                    });

                });
            };

            return $service;

    }]);

})(window.mao, window.jQuery);