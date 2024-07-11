import * as React from "react";
import { useId, useBoolean } from "@fluentui/react-hooks";
import {
  getTheme,
  mergeStyleSets,

  FontWeights,
  Modal,
  IIconProps,
} from "@fluentui/react";
import { IconButton, IButtonStyles } from "@fluentui/react/lib/Button";


export const MYModal = (myprops: { handler: () => void; children: React.ReactNode }) => {
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);
  const [isPopup, setisPopup] = React.useState(true);
  const titleId = useId("title");

  React.useEffect(() => {
    if (isPopup) {
      showModal();
    } else {
      hideModal();
      myprops.handler();
    }
  }, [isPopup]);
  

  function ExitHandler() {
    hideModal();
    setisPopup((current) => !current);
    myprops.handler();
  }

  return (
    <div id="modal">
      <Modal
        titleAriaId={titleId}
        isOpen={isModalOpen}
        onDismiss={ExitHandler}
        isBlocking={true}
        containerClassName={contentStyles.container}
      >
        <div className={contentStyles.header}>
          
          <IconButton
            styles={iconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close popup modal"
            onClick={ExitHandler}
          />
        </div>
        <div className={contentStyles.body}>
          {/* Dışarıdan gelen içerik burada kullanılıyor */}
          {myprops.children}
        </div>
      </Modal>
    </div>
  );
};

const cancelIcon: IIconProps = { iconName: "Cancel" };

const theme = getTheme();
const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "stretch",
  },
  header: [
    // eslint-disable-next-line deprecation/deprecation
    theme.fonts.xLarge,
    {
      flex: "1 1 auto",
      borderTop: "4px solid ${theme.palette.themePrimary}",
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.semibold,
      padding: "12px 12px 14px 24px",
    },
  ],
  body: {
    flex: "4 4 auto",
    padding: "0 24px 24px 24px",
    overflowY: "hidden",
    selectors: {
      p: { margin: "14px 0" },
      "p:first-child": { marginTop: 0 },
      "p:last-child": { marginBottom: 0 },
    },
  },
});

const iconButtonStyles: Partial<IButtonStyles> = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: "auto",
    marginTop: "4px",
    marginRight: "2px",
  },
  rootHovered: {
    color: theme.palette.neutralDark,
  },
};
