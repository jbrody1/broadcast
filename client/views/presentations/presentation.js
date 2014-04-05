Template.presentation.helpers({
    isPresenter: function() {
        return Session.get('isPresenter');
    }
});

Template.presentation.rendered = function() {
    presentationData = this.data;
    var page = Session.get('isPresenter') ? 1 : this.data.page;

    viewer = Crocodoc.createViewer('.viewer', {
        url: 'https://view-api.box.com/1/sessions/'+ presentationData.sessionId + '/assets',
        layout: Crocodoc.LAYOUT_PRESENTATION,
        page: page
    });
    viewer.load();

    viewer.on('ready', function() {
        // Delay because the viewer loads slightly before the template is ready
        // there is probably a better way of doing this?
        _.delay(function() {
            $('.viewer').addClass('fade-in');
        }, 700);
    });

    // Update the DB whenever the page changes
    if (Session.get('isPresenter')) {
        viewer.on('pagefocus', function(event) {
            Presentations.update({_id: presentationData._id}, {
                $set: {page: event.data.page}
            });
        });
    };

    Deps.autorun(function() {
        // Only update the page if this is not the presenter
        if (!Session.get('isPresenter')) {
            var presentationCursor = Presentations.find({_id: presentationData._id});
            currentPage = presentationCursor.fetch()[0].page;
            // Must use try/catch block because of bug in Deps.afterFlush
            try {
                viewer.scrollTo(currentPage);
            } catch (e) {
                var dumbErrorArray = [
                    "Cannot call method 'scrollTo' of undefined",
                    "Cannot read property 'scrollTo' of undefined"
                ]
                if ($.inArray(e.message, dumbErrorArray) === -1) {
                    throw(e);
                }
            }
        }
    });
};

Template.presentation.events({
    'click button': function(e) {
        e.preventDefault();

        var $button = $(e.target);

        if ($button.get(0).id === 'next') {
            viewer.scrollTo(Crocodoc.SCROLL_NEXT);
        } else if ($button.get(0).id === 'previous') {
            viewer.scrollTo(Crocodoc.SCROLL_PREVIOUS);
        }
    }
});
