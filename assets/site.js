(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------------------------------------------------------------- theme */

  try {
    var savedTheme = localStorage.getItem('eveyla-theme');
    if (savedTheme === 'dark') root.setAttribute('data-theme', 'dark');
  } catch (error) {
    /* storage can be blocked */
  }

  doc.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      if (dark) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', 'dark');
      try {
        localStorage.setItem('eveyla-theme', dark ? 'light' : 'dark');
      } catch (error) {
        /* ignore */
      }
      button.setAttribute('aria-label', dark ? 'Switch to dark theme' : 'Switch to light theme');
    });
  });

  /* ---------------------------------------------------------------- search hint */

  var searchLabels = doc.querySelectorAll('[data-search-label]');
  if (searchLabels.length) {
    var hintWords = ['iphone', 'chicken', 'book', 'chocolate', 'detergent', 'juice', 'potato', 'milk', 'tea', 'fruit', 'oil', 'rice'];
    var hintIndex = 0;
    window.setTimeout(function () {
      window.setInterval(function () {
        hintIndex = (hintIndex + 1) % hintWords.length;
        searchLabels.forEach(function (label) {
          label.textContent = 'Search ' + hintWords[hintIndex];
        });
      }, 2600);
    }, 6000);
  }

  /* ---------------------------------------------------------------- top bar */

  var topbar = doc.querySelector('[data-topbar]');
  if (topbar) {
    var syncTopbar = function () {
      if (window.scrollY > 8) topbar.classList.add('is-shown');
      else topbar.classList.remove('is-shown');
    };
    syncTopbar();
    window.addEventListener('scroll', syncTopbar, { passive: true });
  }

  /* ---------------------------------------------------------------- menus */

  var azButton = doc.querySelector('[data-disclosure="az"]');
  if (azButton) {
    var azLabel = azButton.getAttribute('data-az-label') || azButton.textContent.trim();
    azButton.setAttribute('data-az-label', azLabel);
  }

  doc.querySelectorAll('[data-disclosure]').forEach(function (button) {
    var key = button.getAttribute('data-disclosure');
    var panel = doc.querySelector('[data-panel="' + key + '"]');
    if (!panel) return;
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (open) panel.classList.add('is-hidden');
      else panel.classList.remove('is-hidden');
      if (key === 'az') {
        button.textContent = open
          ? button.getAttribute('data-az-label')
          : 'Hide the full list';
      }
    });
  });

  /* ---------------------------------------------------------------- show more */

  doc.querySelectorAll('[data-more]').forEach(function (button) {
    button.addEventListener('click', function () {
      var section = button.closest('section');
      if (!section) return;
      var hidden = Array.prototype.slice.call(section.querySelectorAll('.extra-card.is-hidden'));
      hidden.slice(0, 10).forEach(function (card) {
        card.classList.remove('is-hidden');
      });
      if (hidden.length <= 10) button.classList.add('is-hidden');
    });
  });

  /* ---------------------------------------------------------------- home chips */

  var homeChips = doc.querySelectorAll('[data-home-chip]');
  if (homeChips.length) {
    var homeFilters = { open: false, free: false, topRated: false, verified: false };
    var applyHomeFilters = function () {
      doc.querySelectorAll('.shop-card').forEach(function (card) {
        var show =
          (!homeFilters.open || card.getAttribute('data-open') === 'true') &&
          (!homeFilters.free || card.getAttribute('data-free') === 'true') &&
          (!homeFilters.topRated || Number(card.getAttribute('data-rating') || 0) > 0) &&
          (!homeFilters.verified || card.getAttribute('data-verified') === 'true');
        card.classList.toggle('is-filtered', !show);
      });
    };
    homeChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-home-chip');
        homeFilters[key] = !homeFilters[key];
        chip.classList.toggle('is-selected', homeFilters[key]);
        chip.setAttribute('aria-pressed', homeFilters[key] ? 'true' : 'false');
        applyHomeFilters();
      });
    });
  }

  /* ---------------------------------------------------------------- category */

  var shopList = doc.querySelector('[data-shop-list]');

  if (shopList) {
    var rows = Array.prototype.slice.call(shopList.querySelectorAll('.shop-row'));
    rows.forEach(function (row, index) {
      row.setAttribute('data-order', String(index));
    });

    var baseShown = rows.filter(function (row) {
      return !row.classList.contains('is-extra');
    }).length || 6;
    var shown = baseShown;
    var sortMode = 'nearest';
    var sortLabels = {
      nearest: 'Nearest',
      open: 'Open now',
      items: 'Most items',
      rated: 'Top rated',
      newest: 'Newest',
      name: 'Name A to Z'
    };
    var activeFilters = { open: false, verified: false, free: false, cart: false };

    var emptyState = doc.createElement('div');
    emptyState.className = 'filter-empty is-hidden';
    emptyState.innerHTML =
      '<h2>No shops match your filters</h2>' +
      '<p>Your filters hid everything in this category.</p>' +
      '<button type="button" class="btn-secondary" data-clear-filters>Clear filters</button>';
    shopList.parentNode.insertBefore(emptyState, shopList.nextSibling);

    var numeric = function (row, key) {
      return Number(row.getAttribute('data-' + key) || 0);
    };

    var sortRows = function () {
      var sorted = rows.slice();
      sorted.sort(function (a, b) {
        if (sortMode === 'open') {
          var openDiff = numeric(b, 'open') - numeric(a, 'open');
          if (openDiff) return openDiff;
        }
        if (sortMode === 'rated' || sortMode === 'items') {
          var ratingDiff = numeric(b, 'rating') - numeric(a, 'rating');
          if (ratingDiff) return ratingDiff;
        }
        if (sortMode === 'name') {
          return String(a.getAttribute('data-name') || '').localeCompare(
            String(b.getAttribute('data-name') || ''),
            'en'
          );
        }
        return numeric(a, 'order') - numeric(b, 'order');
      });
      sorted.forEach(function (row) {
        shopList.appendChild(row);
      });
    };

    var matches = function (row) {
      if (activeFilters.open && row.getAttribute('data-open') !== 'true') return false;
      if (activeFilters.verified && row.getAttribute('data-verified') !== 'true') return false;
      if (activeFilters.free && row.getAttribute('data-free') !== 'true') return false;
      if (activeFilters.cart && row.getAttribute('data-cart') !== 'true') return false;
      return true;
    };

    var moreButton = doc.querySelector('[data-category-more]');

    var applyCategory = function () {
      var filtered = rows.filter(matches);
      filtered.forEach(function (row, index) {
        row.classList.toggle('is-hidden', index >= shown);
      });
      rows.forEach(function (row) {
        if (filtered.indexOf(row) === -1) row.classList.add('is-hidden');
      });
      emptyState.classList.toggle('is-hidden', filtered.length > 0);
      shopList.classList.toggle('is-hidden', filtered.length === 0);
      if (moreButton) {
        moreButton.classList.toggle('is-hidden', filtered.length <= shown);
        if (moreButton.parentNode) moreButton.parentNode.classList.toggle('is-hidden', filtered.length <= shown);
      }
    };

    doc.querySelectorAll('[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-filter');
        if (!(key in activeFilters)) return;
        activeFilters[key] = !activeFilters[key];
        chip.setAttribute('aria-pressed', activeFilters[key] ? 'true' : 'false');
        shown = baseShown;
        applyCategory();
      });
    });

    var clearFilters = emptyState.querySelector('[data-clear-filters]');
    if (clearFilters) {
      clearFilters.addEventListener('click', function () {
        Object.keys(activeFilters).forEach(function (key) {
          activeFilters[key] = false;
        });
        doc.querySelectorAll('[data-filter]').forEach(function (chip) {
          chip.setAttribute('aria-pressed', 'false');
        });
        shown = baseShown;
        applyCategory();
      });
    }

    if (moreButton) {
      moreButton.addEventListener('click', function () {
        shown += 10;
        applyCategory();
      });
    }

    var sortButton = doc.querySelector('[data-sort-button]');
    if (sortButton) {
      sortButton.addEventListener('click', function () {
        openSortSheet(sortMode, function (value) {
          sortMode = value;
          sortButton.textContent = sortLabels[value] || 'Nearest';
          if (value !== 'name') {
            sortButton.innerHTML =
              '<svg class="icon-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4v16M4 8l4-4 4 4"></path><path d="M16 20V4M12 16l4 4 4-4"></path></svg>' +
              '<span>' + (sortLabels[value] || 'Nearest') + '</span>';
          } else {
            sortButton.textContent = sortLabels[value];
          }
          sortRows();
          applyCategory();
        });
      });
    }

    applyCategory();
  }

  function openSortSheet(current, choose) {
    var options = [
      ['nearest', 'Nearest first', 'Storefronts first, then your island, then who delivers here'],
      ['open', 'Open right now', 'Closed shops drop to the bottom'],
      ['items', 'Most items', 'Bigger catalogues first'],
      ['rated', 'Top rated', 'Only some shops carry a rating so far'],
      ['newest', 'Newest on Eveyla', ''],
      ['name', 'Name A to Z', '']
    ];
    var selected = current;
    var backdrop = doc.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sort-sheet-title">' +
      '<div class="sheet-head"><h2 id="sort-sheet-title">Sort shops</h2>' +
      '<button type="button" class="sheet-close" data-sheet-close aria-label="Close">×</button></div>' +
      '<div class="sheet-body">' +
      options
        .map(function (option) {
          return (
            '<button type="button" class="sheet-option" data-sheet-option="' + option[0] + '">' +
            '<span><span class="sheet-option-title">' + option[1] + '</span>' +
            (option[2] ? '<span class="sheet-option-sub">' + option[2] + '</span>' : '') +
            '</span><span class="sheet-radio" aria-hidden="true"></span></button>'
          );
        })
        .join('') +
      '</div>' +
      '<div class="sheet-foot"><button type="button" class="btn-primary btn-full" data-sheet-done>Show shops</button></div>' +
      '</div>';

    doc.body.appendChild(backdrop);
    doc.body.classList.add('sheet-open');

    var sync = function () {
      backdrop.querySelectorAll('[data-sheet-option]').forEach(function (button) {
        var on = button.getAttribute('data-sheet-option') === selected;
        button.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
    sync();

    var close = function () {
      backdrop.remove();
      doc.body.classList.remove('sheet-open');
    };

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) close();
    });
    backdrop.querySelector('[data-sheet-close]').addEventListener('click', close);
    backdrop.querySelector('[data-sheet-done]').addEventListener('click', function () {
      close();
      choose(selected);
    });
    backdrop.querySelectorAll('[data-sheet-option]').forEach(function (button) {
      button.addEventListener('click', function () {
        selected = button.getAttribute('data-sheet-option');
        sync();
      });
    });
    doc.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') {
        close();
        doc.removeEventListener('keydown', onKey);
      }
    });
  }

  /* ---------------------------------------------------------------- search */

  var overlay = doc.querySelector('[data-search-overlay]');
  if (overlay) {
    var input = overlay.querySelector('[data-search-input]');
    var note = overlay.querySelector('[data-search-note]');
    var clear = overlay.querySelector('[data-search-clear]');
    var lastFocus = null;

    var openSearch = function (event) {
      if (event) event.preventDefault();
      lastFocus = doc.activeElement;
      overlay.classList.remove('is-hidden');
      doc.body.style.overflow = 'hidden';
      window.setTimeout(function () {
        if (input) input.focus();
      }, 30);
    };

    var closeSearch = function () {
      overlay.classList.add('is-hidden');
      doc.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    doc.querySelectorAll('[data-search]').forEach(function (button) {
      button.addEventListener('click', openSearch);
    });
    overlay.querySelector('[data-search-close]').addEventListener('click', closeSearch);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeSearch();
    });

    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !overlay.classList.contains('is-hidden')) closeSearch();
    });

    if (clear) {
      clear.addEventListener('click', function () {
        if (input) {
          input.value = '';
          input.focus();
        }
        if (note) note.textContent = 'Search across every shop in the Maldives.';
      });
    }

    if (input) {
      input.addEventListener('input', function () {
        if (!note) return;
        var value = input.value.trim();
        note.textContent = value
          ? 'Showing matches for “' + value + '” across the Maldives.'
          : 'Search across every shop in the Maldives.';
      });
    }

    overlay.querySelectorAll('.search-tags .chip').forEach(function (tag) {
      tag.addEventListener('click', function () {
        if (!input) return;
        input.value = tag.textContent.trim();
        input.focus();
        if (note) note.textContent = 'Showing matches for “' + input.value + '” across the Maldives.';
      });
    });
  }

  /* ---------------------------------------------------------------- password */

  doc.querySelectorAll('[data-password-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var field = button.closest('.password-wrap');
      var input = field ? field.querySelector('input') : null;
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', show ? 'true' : 'false');
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  /* ---------------------------------------------------------------- login */

  var loginForm = doc.querySelector('[data-login-form]');
  var toast = doc.querySelector('[data-login-toast]');
  var toastTimer = null;
  var showToast = function () {
    if (!toast) return;
    toast.classList.remove('is-hidden');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.add('is-hidden');
    }, 2600);
  };

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      showToast();
    });
  }
  doc.querySelectorAll('[data-forgot], .btn-google').forEach(function (button) {
    button.addEventListener('click', showToast);
  });

  /* ---------------------------------------------------------------- back */

  doc.querySelectorAll('[data-back]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.assign('/');
    });
  });

  /* ---------------------------------------------------------------- islands */

  var islandData = doc.querySelector('[data-island-data]');
  if (islandData) {
    var islands = [];
    try {
      islands = JSON.parse(islandData.textContent || '[]');
    } catch (error) {
      islands = [];
    }

    doc.querySelectorAll('[data-island]').forEach(function (button) {
      button.addEventListener('click', function () {
        openIslandSheet(islands);
      });
    });
  }

  function openIslandSheet(islands) {
    var backdrop = doc.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="island-sheet-title">' +
      '<div class="sheet-head"><h2 id="island-sheet-title">Where are you?</h2>' +
      '<button type="button" class="sheet-close" data-sheet-close aria-label="Close">×</button></div>' +
      '<p class="sheet-note">Shops on your island, plus everyone who delivers to it.</p>' +
      '<div class="sheet-body island-list">' +
      '<button type="button" class="island-option" data-island-option="">All of the Maldives</button>' +
      islands
        .map(function (island) {
          return (
            '<button type="button" class="island-option" data-island-option="' +
            escapeAttr(island) +
            '">' +
            escapeHtml(island) +
            '</button>'
          );
        })
        .join('') +
      '</div></div>';
    doc.body.appendChild(backdrop);
    doc.body.classList.add('sheet-open');

    var close = function () {
      backdrop.remove();
      doc.body.classList.remove('sheet-open');
    };
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) close();
    });
    backdrop.querySelector('[data-sheet-close]').addEventListener('click', close);
    backdrop.querySelectorAll('[data-island-option]').forEach(function (option) {
      option.addEventListener('click', function () {
        var name = option.getAttribute('data-island-option') || 'Maldives';
        doc.querySelectorAll('[data-island-name]').forEach(function (label) {
          label.textContent = name;
        });
        doc.querySelectorAll('[data-island-sub]').forEach(function (label) {
          label.textContent = name === 'Maldives'
            ? 'Tap to choose your island'
            : 'Shops here, plus everyone who delivers here';
        });
        close();
      });
    });
    doc.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') {
        close();
        doc.removeEventListener('keydown', onKey);
      }
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
