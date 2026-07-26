// Main entry — lay out four bespoke per-theme designs side by side.
// Each artboard is 1200×1340 to give the hero + 3 cards room to breathe.

const ARTBOARD_W = 1200;
const ARTBOARD_H = 1340;

function ThemeShowcaseApp() {
  return (
    <DesignCanvas>
      <DCSection
        id="themes"
        title="Theme showcase"
        subtitle="The same screen — hero + ask + people — drawn through each brand's full visual language. Drag to pan, scroll/⌘+scroll to zoom, double-click an artboard to focus."
      >
        <DCArtboard
          id="bridgecircle"
          label="BridgeCircle · Editorial bone & cobalt"
          width={ARTBOARD_W}
          height={ARTBOARD_H}
        >
          <BridgeCircleBoard />
        </DCArtboard>

        <DCArtboard
          id="facebook"
          label="Facebook · Newsfeed social"
          width={ARTBOARD_W}
          height={ARTBOARD_H}
        >
          <FacebookBoard />
        </DCArtboard>

        <DCArtboard
          id="apple"
          label="Apple · Keynote spec sheet"
          width={ARTBOARD_W}
          height={ARTBOARD_H}
        >
          <AppleBoard />
        </DCArtboard>

        <DCArtboard
          id="ibm"
          label="IBM · Carbon enterprise"
          width={ARTBOARD_W}
          height={ARTBOARD_H}
        >
          <IBMBoard />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ThemeShowcaseApp />);
