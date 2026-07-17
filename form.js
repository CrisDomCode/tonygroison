(function () {
  if (!document.getElementById('main-form')) return;

  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxivC6QQU3I2IpyzYKt_WHXvscU42dKpSUueFNl03vnwKGhYtfKvDdEW7MLmSaq3kXSZA/exec';

  /* ── Particules qu'on ne capitalise pas en milieu de nom ── */
  var PARTS = new Set([
    'de','du','des','le','la','les','d','l',
    'von','van','den','der','di','da','dos','das',
    'dal','del','della','bin','bint','el','al','ben',
    'af','av','zu','zum'
  ]);

  function titleCaseName(val) {
    var words = val.trim().split(/\s+/);
    return words.map(function(word, idx) {
      if (!word) return word;
      var apo = word.indexOf("'");
      if (apo > 0) {
        var particle = word.slice(0, apo).toLowerCase();
        var rest = word.slice(apo + 1);
        if (PARTS.has(particle)) {
          return particle + "'" + (rest ? rest[0].toUpperCase() + rest.slice(1).toLowerCase() : '');
        }
      }
      var lower = word.toLowerCase();
      if (idx > 0 && PARTS.has(lower)) return lower;
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  function formatPhone(raw) {
    var hasPlus = raw.trimStart().startsWith('+');
    var digits = raw.replace(/\D/g, '');
    if (!digits) return hasPlus ? '+' : '';

    if (hasPlus) {
      if (digits.startsWith('33')) {
        var loc33 = digits.slice(2);
        var c33 = loc33.length ? [loc33.slice(0, 1)] : [];
        for (var i = 1; i < loc33.length; i += 2) c33.push(loc33.slice(i, i + 2));
        return '+33' + (c33.length ? ' ' + c33.filter(Boolean).join(' ') : '');
      }
      if (digits.startsWith('1')) {
        var loc1 = digits.slice(1);
        var p1 = [loc1.slice(0,3), loc1.slice(3,6), loc1.slice(6,10)].filter(Boolean);
        return '+1' + (p1.length ? ' ' + p1.join(' ') : '');
      }
      var grp = digits.match(/.{1,3}/g) || [];
      return '+' + grp.join(' ');
    } else {
      var pairs = digits.match(/.{1,2}/g) || [];
      return pairs.join(' ');
    }
  }

  function isPhoneValid(val) {
    var digits = val.replace(/\D/g, '');
    if (digits.charAt(0) === '0') return digits.length === 10;
    if (digits.startsWith('33')) return digits.length === 11;
    return digits.length >= 7 && digits.length <= 15;
  }

  function isNameValid(val) {
    var parts = val.trim().split(/\s+/);
    return parts.length >= 2 && parts[0].length >= 1 && parts[parts.length - 1].length >= 1;
  }

  var s1        = document.getElementById('hif-s1');
  var s2        = document.getElementById('hif-s2');
  var okDiv     = document.getElementById('hif-ok');
  var nextBtn   = document.getElementById('hif-next');
  var besoinInput = document.getElementById('hif-besoin');
  var nameInput = document.getElementById('hif-name');
  var telInput  = document.getElementById('hif-tel');
  var fldName   = document.getElementById('fld-name');
  var fldTel    = document.getElementById('fld-tel');
  var submitBtn = document.getElementById('hif-submit');

  nextBtn.addEventListener('click', function () {
      var hifWrap = document.querySelector('.hif-wrap');
    if (!besoinInput.value.trim()) {
      hifWrap.classList.add('v-error');
      document.getElementById('hif-besoin-err').hidden = false;
      besoinInput.focus();
      return;
    }
    s1.hidden = true;
    s2.hidden = false;
    nameInput.focus();
    if (window.umami) umami.track('Formulaire - Étape 2');
  });

  besoinInput.addEventListener('input', function () {
    if (besoinInput.value.trim()) {
      document.querySelector('.hif-wrap').classList.remove('v-error');
      document.getElementById('hif-besoin-err').hidden = true;
    }
  });

  /* Nom : capitalisation immédiate + logique particules au blur */
  nameInput.addEventListener('input', function () {
    var sel = nameInput.selectionStart;
    var newVal = nameInput.value.replace(/(^|\s)(\S)/g, function (m, space, ch) {
      return space + ch.toUpperCase();
    });
    if (newVal !== nameInput.value) {
      nameInput.value = newVal;
      nameInput.setSelectionRange(sel, sel);
    }
    fldName.classList.remove('v-error', 'v-valid');
  });
  nameInput.addEventListener('blur', function () {
    if (nameInput.value.trim()) nameInput.value = titleCaseName(nameInput.value);
    var valid = isNameValid(nameInput.value);
    fldName.classList.toggle('v-valid', valid && nameInput.value.trim().length > 0);
    fldName.classList.toggle('v-error', !valid && nameInput.value.trim().length > 0);
  });

  /* Téléphone : formatage en direct */
  telInput.addEventListener('input', function () {
    var raw = telInput.value;
    var hasPlus = raw.trimStart().startsWith('+');
    var cleaned = raw.replace(/[^\d+]/g, '');
    cleaned = hasPlus ? '+' + cleaned.replace(/\+/g, '') : cleaned.replace(/\+/g, '');
    telInput.value = formatPhone(cleaned);
    fldTel.classList.remove('v-error', 'v-valid');
  });
  telInput.addEventListener('blur', function () {
    if (telInput.value.trim()) {
      var valid = isPhoneValid(telInput.value);
      fldTel.classList.toggle('v-valid', valid);
      fldTel.classList.toggle('v-error', !valid);
    }
  });

  /* Soumission */
  document.getElementById('main-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nameOk = isNameValid(nameInput.value);
    var telOk  = isPhoneValid(telInput.value);

    if (!nameOk) { fldName.classList.add('v-error'); fldName.classList.remove('v-valid'); nameInput.focus(); return; }
    if (!telOk)  { fldTel.classList.add('v-error');  fldTel.classList.remove('v-valid');  telInput.focus();  return; }

    submitBtn.textContent = 'Envoi en cours…';
    submitBtn.disabled = true;

    var payload = new URLSearchParams({
      fullname: nameInput.value,
      company:  document.getElementById('hif-company').value,
      tel:      telInput.value,
      besoin:   besoinInput.value
    });

    function onSent() { s2.hidden = true; okDiv.hidden = false; if (window.umami) umami.track('Formulaire - Soumis'); }

    if (navigator.sendBeacon) {
      navigator.sendBeacon(SCRIPT_URL, payload);
      onSent();
    } else {
      fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      }).catch(function(){}).finally(onSent);
    }
  });
})();
