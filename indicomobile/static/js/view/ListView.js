var ListView = Backbone.View.extend({
    tagName: 'ul',

    attributes: {
        'data-role': 'listview',
        'data-inset': 'true',
        'data-theme': 'c'
    },

    initialize: function() {
        this.template_file = getHTMLTemplate('lists.html');
        this.template = _.template($(this.template_file).siblings(this.options.template_name).html());
        this.agendaCollection = new Backbone.Collection();
        if (this.options.agendaUrl !== undefined){
            this.agendaCollection.url = this.options.agendaUrl;
            this.agendaCollection.fetch();
        }
        this.collection.url = this.options.url;
        this.collection.on('hasChanged', this.appendRender, this);
        this.collection.on('reset', this.render, this);
        this.collection.on('reload', this.initialize, this);
        this.collection.fetch();
    },

    renderItems: function(collection, template, listView){
        var self = this;
        collection.each(function(element){
            if (self.options.agenda){
                element.set('conferenceId', 'agenda_'+element.get('conferenceId'));
            }
            listView.append(template(element.toJSON()));
        });

    },

    render: function() {
        var collection = this.collection,
        self = this,
        container = $(this.options.container),
        template = this.template,
        empty_message = this.options.empty_message,
        term = this.options.term,
        listView = $(this.el);

        listView.empty();

        if (collection.size() > 0){

            self.renderItems(collection, template, listView);

            container.append(listView);

            container.trigger('create');
            listView.listview('refresh');
            container.parent().find('.loader').hide();

            if (term != '' && term != ' ' && term !== undefined){
                for (word in term.split(' ')){
                    container.find('li').highlight(term.split(' ')[word]);
                }
            }

        }
        else{
            if (container.find('.emptyMessage').length > 0){
                container.find('.emptyMessage').show();
            }
            else{
                container.append('<h4 class="emptyMessage">'+empty_message+'</h4>');
            }
            container.parent().find('.loader').hide();
        }
        $.mobile.hidePageLoadingMsg();
        return this;
    }
});

var SessionsList = ListView.extend({

    renderItems: function(collection, template, listView){

        var self = this,
        lastTitle = null;
        console.log(collection)
        console.log(self.agendaCollection)

        collection.each(function(element){
            if (element.get('entries').length > 0){
                element.set('inAgenda', self.options.agenda);
                if (lastTitle === null || lastTitle != element.get('title')){
                    lastTitle = element.get('title');
                    var isInAgenda = self.agendaCollection.find(function(session){
                        return session.get('sessionId') == element.get('sessionId');
                    });
                    var listItem = template(element.toJSON());
                    if (isInAgenda){
                        listItem = listItem.replace('"add"', '"remove"').replace('"c"', '"b"');
                    }
                    listView.append(listItem);
                }
                
            }
        });

    },

    events: {
        "click #addRemoveSession": "addRemoveSession"
    },

    addRemoveSession: function(e) {
        $.mobile.showPageLoadingMsg("a", "Updating", true);
        e.preventDefault();
        addRemoveSessionAction($(e.currentTarget), this.collection);
    }

});

var SessionDaysList = ListView.extend({

    renderItems: function(collection, template, listView){

        var lastDate = null,
        self = this;

        collection.each(function(element){
            if (element.get('entries').length > 0 &&
            (lastDate === null || lastDate != element.get('startDate').date)){
                lastDate = element.get('startDate').date;
                if (self.options.agenda){
                    element.set('conferenceId', 'agenda_'+element.get('conferenceId'));
                }
                listView.append(template(element.toJSON()));
            }
        });

    }

});

var ListByMonthView = ListView.extend({

    renderItems: function(collection, template, listView){

        this.template2 = _.template($(this.template_file).siblings(this.options.template_name2).html());

        var lastDate = null,
        self = this;
        collection.each(function(element){
            element.set('inAgenda', self.options.agenda);
            var month = filterDate(element.get('startDate').date).month +
                ' ' + filterDate(element.get('startDate').date).year;
            if (lastDate === null || lastDate != month){
                lastDate = month;
                listView.append('<li data-role="list-divider">'+month+'</li>');
            }
            var listItem;
            if (element.get('type') == 'simple_event'){
                listItem = self.template2(element.toJSON());
            }
            else{
                listItem = template(element.toJSON());
            }
            var isInAgenda = self.agendaCollection.find(function(event){
                return event.get('id') == element.get('id');
            });
            if (isInAgenda){
                listItem = listItem.replace('"add"', '"remove"').replace('"c"', '"b"');
            }
            listView.append(listItem);
        });

    },

    events: {
        "click #addRemoveEvent": "addRemoveEvent"
    },

    addRemoveEvent: function(e) {
        $.mobile.showPageLoadingMsg("a", "Updating", true);
        e.preventDefault();
        addRemoveEventAction($(e.currentTarget), this.collection);
    }

});

var SpeakerContribsListView = ListView.extend({

    renderItems: function(collection, template, listView){

        var lastDate = null,
        lastTime = null,
        self = this;

        console.log(self.agendaCollection)

        collection.each(function(element){
            element.set('inAgenda', self.options.agenda);
            var day = filterDate(element.get('startDate').date).month +
                ' ' + filterDate(element.get('startDate').date).day +
                ', ' + filterDate(element.get('startDate').date).year;
            if (lastDate === null || lastDate != day){
                lastDate = day;
                lastTime = null;
                listView.append('<li data-role="list-divider">'+day+'</li>');
            }
            if (lastTime === null || lastTime != element.get('startDate').time){
                lastTime = element.get('startDate').time;
                listView.append('<li data-role="list-divider">'+hourToText(element.get('startDate').time)+'</li>');
            }
            var isInAgenda = self.agendaCollection.find(function(contrib){
                if (element.get('id') === undefined){
                    return contrib.get('contributionId') == element.get('contributionId');
                }
                else{
                    return contrib.get('id') == element.get('id');
                }
            });
            var listItem = template(element.toJSON());
            if (isInAgenda){
                listItem = listItem.replace('"add"', '"remove"').replace('"c"', '"b"');
            }
            listView.append(listItem);
        });

    },

    events: {
        "click #addRemoveContribution": "addRemoveContribution"
    },

    addRemoveContribution: function(e) {
        $.mobile.showPageLoadingMsg("a", "Updating", true);
        e.preventDefault();
        addRemoveContributionAction($(e.currentTarget), this.collection);
    }

});

var ContributionListView = ListView.extend({

    renderItems: function(collection, template, listView){

        var lastTime = null,
        lastPosterTime = null
        self = this;

        collection.each(function(element){
            element.set('inAgenda', self.options.agenda);
            if (lastTime === null || lastTime != element.get('startDate').time){
                lastTime = element.get('startDate').time;
                listView.append('<li data-role="list-divider">'+hourToText(lastTime)+'</li>');
            }
            if (element.get('isPoster') && !self.options.sessionDay){
                if (lastPosterTime === null || lastPosterTime != element.get('startDate').time){
                    lastPosterTime = element.get('startDate').time;
                    var template2 = _.template($(self.template_file).siblings('#poster').html());
                    if (self.options.agenda){
                        element.set('conferenceId', 'agenda_'+element.get('conferenceId'));
                    }
                    var listItem = template2(element.toJSON());
                    listView.append(listItem);
                }
            }
            else{
                var isInAgenda = self.agendaCollection.find(function(contrib){
                    return contrib.get('contributionId') == element.get('contributionId');
                });
                var listItem = template(element.toJSON());
                if (isInAgenda){
                    listItem = listItem.replace('"add"', '"remove"').replace('"c"', '"b"');
                }
                listView.append(listItem);
            }
        });

    },

    events: {
        "click #addRemoveContribution": "addRemoveContribution"
    },

    addRemoveContribution: function(e) {
        $.mobile.showPageLoadingMsg("a", "Updating", true);
        e.preventDefault();
        addRemoveContributionAction($(e.currentTarget), this.collection);
    }

});

var InfiniteListView = ListView.extend({

    initialize: function () {
        InfiniteListView.__super__.initialize.call(this);
        this.infiniScroll = new Backbone.InfiniScroll(this.collection, {
          success: function(collection, changed) {
              collection.trigger('hasChanged', [changed]);
          },
          includePage : true});
        this.infiniScroll.enableFetch();
    }

});

var SpeakerListView = InfiniteListView.extend({

    appendRender: function(newitems) {
        var container = $(this.options.container);
        if (newitems[0].length > 0){
            this.renderItems(new Speakers(newitems[0]), this.template, this.options.term);
        }
        else{
            container.parent().find('.loader').hide();
        }
    },


    renderItems: function(items, template, highlight_term) {
        var collection = items,
        self = this,
        container = $(this.options.container),
        listView = $(this.el);
        container.data('view', this);
        collection.each(function(element){
            if (self.options.lastIndex === null || self.options.lastIndex != element.get('name')[0]){
                self.options.lastIndex = element.get('name')[0];
                listView.append('<li data-role="list-divider">'+element.get('name')[0]+'</li>');
            }
            if (self.options.agenda){
                element.set('conferenceId', 'agenda_'+element.get('conferenceId'))
            }
            listView.append(template(element.toJSON()));
        });

        container.append(listView);

        container.trigger('create');
        listView.listview('refresh');

        if (highlight_term != '' && highlight_term != ' ' && typeof highlight_term !== 'undefined'){
            for (word in highlight_term.split(' ')){
                container.find('li').highlight(highlight_term.split(' ')[word]);
            }
        }
        $(this.options.container).parent().find('.emptyMessage').hide();
        if (collection.size() < 20 || this.options.agenda){
            $(this.options.container).parent().find('.loader').hide();
        }
        return this;
    },

    render: function(){
        if (this.collection.size() > 0){
            if (this.options.agenda){
                $(this.el).attr('data-filter', true)
            }
            this.renderItems(this.collection, this.template, this.options.term);
        }
        else {
            $(this.options.container).parent().find('.loader').hide();
            $(this.options.container).parent().find('.emptyMessage').show();
        }
    }
});

var SearchResultsView = SpeakerListView.extend({


    renderItems: function(items, template, highlight_term) {
        console.log(this.agendaCollection)
        console.log(this.collection)
        var collection = items,
        self = this,
        container = $(this.options.container),
        lastDate = null,
        listView = $(this.el);
        container.data('view', this);
        collection.each(function(element){
            element.set('inAgenda', false);
            var month = filterDate(element.get('startDate').date).month +
                ' ' + filterDate(element.get('startDate').date).year;
            if (lastDate === '' || lastDate != month){
                lastDate = month;
                listView.append('<li data-role="list-divider">'+month+'</li>');
            }
            var isInAgenda = self.agendaCollection.find(function(event){
                return event.get('id') == element.get('id');
            });
            listItem = template(element.toJSON());
            if (isInAgenda){
                listItem = listItem.replace('"add"', '"remove"').replace('"c"','"b"');
            }
            listView.append(listItem);
        });

        container.append(listView);

        container.trigger('create');
        listView.listview('refresh');

        if (highlight_term != '' && highlight_term != ' ' && typeof highlight_term !== 'undefined'){
            for (word in highlight_term.split(' ')){
                container.find('li').highlight(highlight_term.split(' ')[word]);
            }
        }
        $(this.options.container).parent().find('.emptyMessage').hide();
        if (collection.size() < 20){
            $(this.options.container).parent().find('.loader').hide();
        }
        return this;
    },

    events: {
        "click #addRemoveEvent": "addRemoveEvent"
    },

    addRemoveEvent: function(e) {
        $.mobile.showPageLoadingMsg("a", "Updating", true);
        e.preventDefault();
        addRemoveEventAction($(e.currentTarget), null);
    }

});

var HistoryListView = ListView.extend({

    initialize: function(){
        this.template_file = getHTMLTemplate('lists.html');
        this.template = _.template($(this.template_file).siblings(this.options.template_name).html());
        this.collection = loadHistory();
        this.collection.comparator = function(event){return -event.get('viewedAt');};
        this.collection.sort();
        var agendaList = getHistoryInAgenda();
        console.log(agendaList)
        this.agendaCollection = new Events(getHistoryInAgenda());
        this.render();
    },

    renderItems: function(collection, template, listView){
        var self = this,
        lastTime = null;
        console.log(self.agendaCollection)
        collection.each(function(element){
            element.set('inAgenda', false);
            if (lastTime == null || lastTime != element.get('viewedAt')){
                lastTime = element.get('viewedAt');
                listView.append('<li data-role="list-divider">'+new Date(lastTime)+'</li>')
            }
            var isInAgenda = self.agendaCollection.find(function(event){
                return event.get('id') == element.get('id');
            });
            listItem = template(element.toJSON());
            if (isInAgenda){
                listItem = listItem.replace('"add"', '"remove"').replace('"c"','"b"');
            }
            listView.append(listItem);
        });

    },

    events: {
        "click #addRemoveEvent": "addRemoveEvent"
    },

    addRemoveEvent: function(e) {
        $.mobile.showPageLoadingMsg("a", "Updating", true);
        e.preventDefault();
        addRemoveEventAction($(e.currentTarget), null);
    }

});