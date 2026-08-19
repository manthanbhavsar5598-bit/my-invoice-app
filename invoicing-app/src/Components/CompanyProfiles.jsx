import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Building2,
  Mail,
  Phone,
  Landmark,
  CreditCard,
  Hash,
  MapPin,
  Save,
  X,
  FileText,
  ListOrdered,
} from "lucide-react";
import { uid } from "../utils/helpers";


/* ==========================================================
   EMPTY PROFILE
   ========================================================== */

const emptyProfile = () => ({
  id: uid("biz"),

  name: "",
  email: "",
  phone: "",

  address: "",

  gstNumber: "",
  panNumber: "",

  invoicePrefix: "",

  currencySymbol: "₹",

  bankName: "",
  branchName: "",
  accountNo: "",
  ifscCode: "",

  terms: "",
});


/* ==========================================================
   INITIALS
   ========================================================== */

function initials(name) {
  const value = (name || "Company")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  return value || "CO";
}


/* ==========================================================
   FIELD COMPONENT
   ========================================================== */

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  textarea = false,
  icon: Icon,
}) {
  return (
    <label className="cs-field">

      <span className="cs-label">
        {label}

        {required && (
          <b>*</b>
        )}
      </span>


      <div
        className={`cs-input-wrap ${
          Icon ? "has-icon" : ""
        }`}
      >

        {Icon && (
          <span className="cs-input-icon">
            <Icon size={16} />
          </span>
        )}


        {textarea ? (
          <textarea
            value={value || ""}
            placeholder={placeholder}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        ) : (
          <input
            type={type}
            value={value || ""}
            placeholder={placeholder}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        )}

      </div>

    </label>
  );
}


/* ==========================================================
   SECTION TITLE
   ========================================================== */

function SectionTitle({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="cs-section-heading">

      <div className="cs-section-icon">
        <Icon size={17} />
      </div>


      <div>

        <h3>
          {title}
        </h3>

        {description && (
          <p>
            {description}
          </p>
        )}

      </div>

    </div>
  );
}


/* ==========================================================
   PROFILE LIST ITEM
   ========================================================== */

function ProfileListItem({
  profile,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`cs-profile-item ${
        selected ? "selected" : ""
      }`}
      onClick={onClick}
    >

      <div className="cs-profile-avatar">
        {initials(profile.name)}
      </div>


      <div className="cs-profile-item-content">

        <strong>
          {profile.name ||
            "Unnamed company"}
        </strong>


        <span>

          <Building2 size={13} />

          {profile.gstNumber ||
            "GST not registered"}

        </span>

      </div>

    </button>
  );
}


/* ==========================================================
   EMPTY STATE
   ========================================================== */

function EmptyState({ onAdd }) {
  return (
    <div className="cs-empty">

      <div className="cs-empty-icon">
        <Building2 size={30} />
      </div>


      <h2>
        No company profiles
      </h2>


      <p>
        Add your first company profile
        to start creating invoices with
        your business details.
      </p>


      <button
        className="cs-primary"
        onClick={onAdd}
      >
        <Plus size={16} />

        Add company profile
      </button>

    </div>
  );
}


/* ==========================================================
   MAIN COMPONENT
   ========================================================== */

export default function CompanyProfiles({
  profiles,
  onSave,
  onDelete,
}) {

  const [selectedId, setSelectedId] =
    useState(
      profiles?.[0]?.id || null
    );


  const [form, setForm] =
    useState(
      profiles?.[0] ||
        emptyProfile()
    );


  const [saving, setSaving] =
    useState(false);


  const [isNew, setIsNew] =
    useState(false);


  /* ========================================================
     SYNC PROFILES
     ======================================================== */

  useEffect(() => {

    if (
      !profiles ||
      profiles.length === 0
    ) {

      setSelectedId(null);

      if (!isNew) {
        setForm(emptyProfile());
      }

      return;
    }


    /*
     * Do not replace a profile currently
     * being created.
     */

    if (isNew) {
      return;
    }


    const selected =
      profiles.find(
        (p) =>
          p.id === selectedId
      ) ||
      profiles[0];


    if (!selected) {
      return;
    }


    setSelectedId(
      selected.id
    );

    setForm({
      ...selected,
    });

  }, [
    profiles,
    selectedId,
    isNew,
  ]);


  /* ========================================================
     SELECT PROFILE
     ======================================================== */

  const selectProfile = (
    profile
  ) => {

    setIsNew(false);

    setSelectedId(
      profile.id
    );

    setForm({
      ...profile,
    });
  };


  /* ========================================================
     ADD PROFILE
     ======================================================== */

  const addProfile = () => {

    const profile =
      emptyProfile();


    setIsNew(true);

    setSelectedId(
      profile.id
    );

    setForm(profile);
  };


  /* ========================================================
     SET FIELD
     ======================================================== */

  const setField =
    (key) =>
    (value) => {

      setForm(
        (current) => ({
          ...current,
          [key]: value,
        })
      );
    };


  /* ========================================================
     SAVE
     ======================================================== */

  const handleSave =
    async () => {

      if (
        !form.name ||
        !form.name.trim()
      ) {

        alert(
          "Please enter the company name."
        );

        return;
      }


      setSaving(true);


      try {

        const payload = {
          ...form,

          name:
            form.name.trim(),
        };


        await onSave(payload);


        setIsNew(false);

        setSelectedId(
          form.id
        );

      } finally {

        setSaving(false);
      }
    };


  /* ========================================================
     DELETE
     ======================================================== */

  const handleDelete =
    async () => {

      /*
       * New unsaved profile
       */

      if (!form.id || isNew) {

        if (
          profiles &&
          profiles.length > 0
        ) {

          setIsNew(false);

          selectProfile(
            profiles[0]
          );

        } else {

          setForm(
            emptyProfile()
          );
        }

        return;
      }


      const confirmed =
        window.confirm(
          `Delete "${
            form.name ||
            "this company profile"
          }"?\n\nPast invoices will keep their saved company details.`
        );


      if (!confirmed) {
        return;
      }


      await onDelete(
        form.id
      );


      const remaining =
        profiles.filter(
          (profile) =>
            profile.id !==
            form.id
        );


      if (
        remaining.length > 0
      ) {

        setIsNew(false);

        setSelectedId(
          remaining[0].id
        );

        setForm({
          ...remaining[0],
        });

      } else {

        const newProfile =
          emptyProfile();

        setIsNew(true);

        setSelectedId(
          newProfile.id
        );

        setForm(
          newProfile
        );
      }
    };


  /* ========================================================
     EMPTY DATABASE
     ======================================================== */

  if (
    (!profiles ||
      profiles.length === 0) &&
    !isNew
  ) {

    return (
      <div className="company-settings-page">

        <div className="company-settings-header">

          <div>

            <h1>
              Company Settings
            </h1>

            <p>
              Manage your company profiles
              and billing information.
            </p>

          </div>


          <button
            className="cs-primary"
            onClick={addProfile}
          >

            <Plus size={16} />

            Add

          </button>

        </div>


        <EmptyState
          onAdd={addProfile}
        />

      </div>
    );
  }


  /* ========================================================
     PAGE
     ======================================================== */

  return (
    <div className="company-settings-page">


      {/* ====================================================
          PAGE HEADER
         ==================================================== */}

      <div className="company-settings-header">

        <div>

          <h1>
            Company Settings
          </h1>

          <p>
            Manage your company profiles
            and billing information.
          </p>

        </div>

      </div>


      {/* ====================================================
          TWO COLUMN LAYOUT
         ==================================================== */}

      <div className="company-settings-layout">


        {/* ==================================================
            LEFT PROFILE LIST
           ================================================== */}

        <aside className="company-profile-sidebar">

          <div className="company-profile-sidebar-head">

            <div className="company-profile-title">

              <span>
                PROFILES
              </span>

            </div>


            <button
              type="button"
              className="cs-add-small"
              onClick={addProfile}
            >

              <Plus size={17} />

              Add

            </button>

          </div>


          <div className="company-profile-list">

            {profiles &&
              profiles.map(
                (profile) => (

                  <ProfileListItem
                    key={profile.id}
                    profile={profile}
                    selected={
                      !isNew &&
                      selectedId ===
                        profile.id
                    }
                    onClick={() =>
                      selectProfile(
                        profile
                      )
                    }
                  />

                )
              )}


            {isNew && (

              <button
                type="button"
                className="cs-profile-item selected new-profile-item"
              >

                <div className="cs-profile-avatar new">

                  <Plus size={18} />

                </div>


                <div className="cs-profile-item-content">

                  <strong>
                    New company
                  </strong>

                  <span>
                    Unsaved profile
                  </span>

                </div>

              </button>

            )}

          </div>


          <div className="company-profile-sidebar-footer">

            <div className="cs-profile-count">

              <Building2 size={14} />

              <span>

                {profiles?.length || 0}{" "}

                {profiles?.length === 1
                  ? "company profile"
                  : "company profiles"}

              </span>

            </div>

          </div>

        </aside>


        {/* ==================================================
            RIGHT EDITOR
           ================================================== */}

        <section className="company-settings-editor">


          {/* =================================================
              EDITOR HEADER
             ================================================= */}

          <div className="company-settings-editor-header">

            <div>

              <div className="cs-editor-kicker">
                COMPANY PROFILE
              </div>


              <h2>

                {isNew
                  ? "Add Company"
                  : "Edit Profile"}

              </h2>


              <p>
                Update the business information
                used when generating invoices.
              </p>

            </div>


            <button
              type="button"
              className="cs-delete-button"
              onClick={handleDelete}
              disabled={saving}
            >

              <Trash2 size={16} />

              Delete

            </button>

          </div>


          {/* =================================================
              EDITOR BODY
             ================================================= */}

          <div className="company-settings-editor-body">


            {/* ===============================================
                BUSINESS INFORMATION
               =============================================== */}

            <section className="cs-form-section">

              <SectionTitle
                icon={Building2}
                title="Business information"
                description="Basic company information displayed on invoices."
              />


              <div className="cs-form-grid cs-two-columns">


                <Field
                  label="Company Name"
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="Enter company name"
                  required
                />


                <Field
                  label="Invoice Prefix"
                  value={form.invoicePrefix}
                  onChange={setField("invoicePrefix")}
                  placeholder="e.g. NNC26-27/"
                  icon={ListOrdered}
                />


                <Field
                  label="Email"
                  value={form.email}
                  onChange={setField("email")}
                  placeholder="company@example.com"
                  type="email"
                  icon={Mail}
                />


                <Field
                  label="GST Number"
                  value={form.gstNumber}
                  onChange={setField(
                    "gstNumber"
                  )}
                  placeholder="Enter GST number"
                  icon={FileText}
                />


                <Field
                  label="PAN Number"
                  value={form.panNumber}
                  onChange={setField(
                    "panNumber"
                  )}
                  placeholder="Enter PAN number"
                  icon={Hash}
                />


                <Field
                  label="Phone Number"
                  value={form.phone}
                  onChange={setField("phone")}
                  placeholder="+91 XXXXX XXXXX"
                  icon={Phone}
                />


                <Field
                  label="Currency Symbol"
                  value={
                    form.currencySymbol
                  }
                  onChange={setField(
                    "currencySymbol"
                  )}
                  placeholder="₹"
                />

              </div>

            </section>


            {/* ===============================================
                ADDRESS
               =============================================== */}

            <section className="cs-form-section">

              <SectionTitle
                icon={MapPin}
                title="Business address"
                description="Your registered business address."
              />


              <div className="cs-form-grid">

                <Field
                  label="Address"
                  value={form.address}
                  onChange={setField(
                    "address"
                  )}
                  placeholder="Enter complete business address"
                  textarea
                />

              </div>

            </section>


            {/* ===============================================
                BANK DETAILS
               =============================================== */}

            <section className="cs-form-section">

              <SectionTitle
                icon={Landmark}
                title="Bank details"
                description="Bank information printed on invoices."
              />


              <div className="cs-form-grid cs-two-columns">


                <Field
                  label="Bank Name"
                  value={form.bankName}
                  onChange={setField(
                    "bankName"
                  )}
                  placeholder="Enter bank name"
                  icon={Landmark}
                />


                <Field
                  label="Branch Name"
                  value={form.branchName}
                  onChange={setField(
                    "branchName"
                  )}
                  placeholder="Enter branch name"
                  icon={MapPin}
                />


                <Field
                  label="Account Number"
                  value={form.accountNo}
                  onChange={setField(
                    "accountNo"
                  )}
                  placeholder="Enter account number"
                  icon={CreditCard}
                />


                <Field
                  label="IFSC Code"
                  value={form.ifscCode}
                  onChange={setField(
                    "ifscCode"
                  )}
                  placeholder="Enter IFSC code"
                  icon={Hash}
                />

              </div>

            </section>


            {/* ===============================================
                TERMS
               =============================================== */}

            <section className="cs-form-section">

              <SectionTitle
                icon={FileText}
                title="Invoice terms"
                description="Optional terms shown at the bottom of invoices."
              />


              <Field
                label="Terms & Conditions"
                value={form.terms}
                onChange={setField(
                  "terms"
                )}
                placeholder={
                  "Payment due within 30 days\nGoods once sold will not be returned"
                }
                textarea
              />

            </section>

          </div>


          {/* =================================================
              FOOTER
             ================================================= */}

          <div className="company-settings-editor-footer">


            <div className="cs-save-hint">

              <span className="cs-save-dot" />

              Changes are saved to this company profile.

            </div>


            <div className="cs-footer-actions">


              {isNew && (

                <button
                  type="button"
                  className="cs-secondary"
                  onClick={() => {

                    if (
                      profiles &&
                      profiles.length > 0
                    ) {

                      setIsNew(false);

                      selectProfile(
                        profiles[0]
                      );

                    }

                  }}
                >

                  <X size={15} />

                  Cancel

                </button>

              )}


              <button
                type="button"
                className="cs-primary cs-save"
                onClick={handleSave}
                disabled={saving}
              >

                <Save size={16} />

                {saving
                  ? "Saving..."
                  : isNew
                  ? "Create Profile"
                  : "Save Changes"}

              </button>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}